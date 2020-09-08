export default function(...args: any[]): void {
  console.log(
    ...args.map(x => 
      ('  ' + Deno.inspect({x}, {compact:false}).slice(7, -2)).replace(/^  /mg, '')
    )
  );
}
