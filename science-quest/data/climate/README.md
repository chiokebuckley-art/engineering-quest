# Archived climate records

The CSV is an unmodified copy of NASA GISS's global Land-Ocean Temperature Index table downloaded on 2026-09-29:
https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts%2BdSST.csv

SHA-256: `c9ce0750ca93a8241c42fe86cd5bf54d07b28b21ae650b0ae49a206907018cd9`.

`src/climate-records.js` retains the `J-D` annual column for 1880–2025 only. All twelve monthly fields must be numeric before a year is included. The incomplete 2026 row is excluded from the activity. Annual figures are copied from NASA's published annual column, not recomputed from rounded monthly values. Units are °C anomalies relative to 1951–1980. This analyzed observational product combines land-surface air and sea-surface water temperature information; it is neither a raw single-station measurement nor a forecast.

Derived activity comparisons use unweighted arithmetic means of the supplied annual values for 1980–1989 and 2010–2019, and endpoint subtraction for 2016–2018. They do not re-create NASA's spatial averaging or uncertainty analysis. This snapshot is intentionally fixed for reproducible scoring. NASA's live product can revise historical estimates as data and methods are updated. Updating the snapshot requires a new source ID, source checksum, assessment review and migration treatment for existing work; do not silently replace its bytes.

Citation: GISTEMP Team, 2026: GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies. Dataset accessed 2026-09-29 at https://data.giss.nasa.gov/gistemp/.

Related publication: Lenssen, N., G. A. Schmidt, M. Hendrickson, P. Jacobs, M. Menne, and R. Ruedy, 2024: A GISTEMPv4 observational uncertainty ensemble. *J. Geophys. Res. Atmos.*, 129(17), e2023JD040179. https://doi.org/10.1029/2023JD040179.

Method and baseline explanation: https://data.giss.nasa.gov/gistemp/faq/.

The lesson's ±0.005 °C numerical acceptance tolerance handles rounding of calculations. It is not an observational uncertainty estimate or confidence interval. The activity does not perform causal attribution, quantify a trend confidence interval, or determine local weather or risk. Source attribution does not imply NASA reviewed or endorsed Science Quest.
