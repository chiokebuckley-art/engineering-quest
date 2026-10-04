import Foundation
import AVFoundation
import CoreGraphics
import CoreMedia
import ImageIO

func createVideo(imagePath: String, audioPath: String, outputPath: String) async throws {
    let imageURL = URL(fileURLWithPath: imagePath)
    let audioURL = URL(fileURLWithPath: audioPath)
    let tempVideoURL = URL(fileURLWithPath: outputPath).deletingLastPathComponent().appendingPathComponent("temp_" + URL(fileURLWithPath: outputPath).lastPathComponent)
    let outputURL = URL(fileURLWithPath: outputPath)

    try? FileManager.default.removeItem(at: tempVideoURL)
    try? FileManager.default.removeItem(at: outputURL)

    // Load audio duration
    let audioAsset = AVURLAsset(url: audioURL)
    let durationTime = try await audioAsset.load(.duration)
    let durationSeconds = CMTimeGetSeconds(durationTime)
    print("Audio duration: \(durationSeconds)s for \(outputPath)")

    // Load source image
    guard let imageSource = CGImageSourceCreateWithURL(imageURL as CFURL, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
        fatalError("Failed to load image from \(imagePath)")
    }

    let width = 1280
    let height = 720
    let fps: Int32 = 30
    let totalFrames = Int(durationSeconds * Double(fps))

    // 1. Create silent video
    let writer = try AVAssetWriter(outputURL: tempVideoURL, fileType: .mp4)
    let videoSettings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 1_800_000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
        ]
    ]

    let writerInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
    writerInput.expectsMediaDataInRealTime = false

    let pixelBufferAttrs: [String: Any] = [
        kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32ARGB),
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
    ]

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
        assetWriterInput: writerInput,
        sourcePixelBufferAttributes: pixelBufferAttrs
    )

    writer.add(writerInput)
    guard writer.startWriting() else {
        fatalError("Writer startWriting failed: \(String(describing: writer.error))")
    }
    writer.startSession(atSourceTime: .zero)

    var pixelBufferPool = adaptor.pixelBufferPool

    // Render frames with subtle Ken Burns zoom and pan
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let imgW = Double(cgImage.width)
    let imgH = Double(cgImage.height)

    for frameIndex in 0..<totalFrames {
        while !writerInput.isReadyForMoreMediaData {
            try await Task.sleep(nanoseconds: 5_000_000)
        }

        let progress = Double(frameIndex) / Double(totalFrames)
        // zoom from 1.0 to 1.15, pan slightly
        let scale = 1.0 + 0.14 * progress
        let panX = (progress - 0.5) * 40.0
        let panY = sin(progress * .pi) * 15.0

        var optPixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            kCVPixelFormatType_32ARGB,
            pixelBufferAttrs as CFDictionary,
            &optPixelBuffer
        )

        guard status == kCVReturnSuccess, let pixelBuffer = optPixelBuffer else {
            fatalError("Failed to allocate pixel buffer at frame \(frameIndex)")
        }

        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer)
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)

        let context = CGContext(
            data: baseAddress,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        )

        if let ctx = context {
            ctx.setFillColor(CGColor(red: 0.05, green: 0.1, blue: 0.15, alpha: 1.0))
            ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))

            let drawW = Double(width) * scale
            let drawH = Double(height) * scale
            let drawX = (Double(width) - drawW) / 2.0 + panX
            let drawY = (Double(height) - drawH) / 2.0 + panY

            ctx.interpolationQuality = .high
            ctx.draw(cgImage, in: CGRect(x: drawX, y: drawY, width: drawW, height: drawH))
        }

        CVPixelBufferUnlockBaseAddress(pixelBuffer, [])

        let frameTime = CMTime(value: Int64(frameIndex), timescale: fps)
        adaptor.append(pixelBuffer, withPresentationTime: frameTime)
    }

    writerInput.markAsFinished()
    await withCheckedContinuation { continuation in
        writer.finishWriting {
            continuation.resume()
        }
    }

    // 2. Combine video and audio using AVMutableComposition
    let videoAsset = AVURLAsset(url: tempVideoURL)
    let composition = AVMutableComposition()

    let compVideoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)
    let compAudioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)

    if let sourceVideoTrack = try await videoAsset.loadTracks(withMediaType: .video).first {
        let videoDuration = try await videoAsset.load(.duration)
        try compVideoTrack?.insertTimeRange(CMTimeRange(start: .zero, duration: videoDuration), of: sourceVideoTrack, at: .zero)
    }

    if let sourceAudioTrack = try await audioAsset.loadTracks(withMediaType: .audio).first {
        let audioDuration = try await audioAsset.load(.duration)
        try compAudioTrack?.insertTimeRange(CMTimeRange(start: .zero, duration: audioDuration), of: sourceAudioTrack, at: .zero)
    }

    guard let exportSession = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetPassthrough) else {
        fatalError("Failed to create export session")
    }

    exportSession.outputURL = outputURL
    exportSession.outputFileType = .mp4
    exportSession.shouldOptimizeForNetworkUse = true

    await exportSession.export()

    if exportSession.status == .completed {
        print("Successfully generated: \(outputPath)")
        try? FileManager.default.removeItem(at: tempVideoURL)
    } else {
        print("Export failed: \(String(describing: exportSession.error))")
    }
}

let args = CommandLine.arguments
if args.count < 4 {
    print("Usage: make-videos <imagePath> <audioPath> <outputPath>")
    exit(1)
}

Task {
    do {
        try await createVideo(imagePath: args[1], audioPath: args[2], outputPath: args[3])
        exit(0)
    } catch {
        print("Error: \(error)")
        exit(1)
    }
}

RunLoop.main.run()
