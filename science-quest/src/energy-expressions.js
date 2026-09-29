/** Small arithmetic interpreter: no JavaScript execution, calls or property access. */
export const joules=[1,2,-2];
const same=(a,b)=>a.every((v,i)=>v===b[i]);
export function energyExpression(source,variables){
 if(typeof source!=='string'||source.length>240)throw Error('Use an expression of at most 240 characters.');
 const tokens=source.match(/\d+(?:\.\d*)?|\.\d+|[a-z]+|[()+*/-]|\S/g)||[];
 if(!tokens.length||tokens.length>120)throw Error('Enter a short arithmetic expression.');let pos=0,depth=0;
 const finite=r=>{if(!Number.isFinite(r.value))throw Error('The expression divides by zero or exceeds the number range.');return r;};
 function primary(){if(++depth>24)throw Error('Too many nested parentheses.');const t=tokens[pos++];let r;if(t==='('){r=sum();if(tokens[pos++]!==')')throw Error('Close each parenthesis.');}else if(t==='-'||t==='+'){r=primary();r={...r,value:t==='-'?-r.value:r.value};}else if(/^\d+(?:\.\d*)?$|^\.\d+$/.test(t||''))r={value:Number(t),units:[0,0,0]};else if(Object.hasOwn(variables,t))r={value:variables[t].value,units:[...variables[t].units]};else throw Error('Unknown symbol: '+(t||'end of expression'));depth--;return finite(r);}
 function product(){let a=primary();while(tokens[pos]==='*'||tokens[pos]==='/'){const op=tokens[pos++],b=primary();a=finite({value:op==='*'?a.value*b.value:a.value/b.value,units:a.units.map((v,i)=>v+(op==='*'?b.units[i]:-b.units[i]))});}return a;}
 function sum(){let a=product();while(tokens[pos]==='+'||tokens[pos]==='-'){const op=tokens[pos++],b=product();if(!same(a.units,b.units))throw Error('Only quantities with matching units can be added or subtracted.');a=finite({value:op==='+'?a.value+b.value:a.value-b.value,units:a.units});}return a;}
 const result=sum();if(pos!==tokens.length)throw Error('Use explicit multiplication (*) and supported arithmetic only.');if(!same(result.units,joules))throw Error('This expression must produce energy in joules (kg·m²/s²).');return result.value;
}
