// replace ^ with pow() in string
let testStr =
  "((abs(a)^(((2*n1+1)*n2)/n1)*abs(b)^(n3/n1)*m^2*n1*n3*cos((m*t)/4)^2*sin((m*t)/4)^2+(abs(a)^(((2*n1+1)*n2)/n1)*abs(b)^(n3/n1)*m^2*n3^2+abs(a)^(((2*n1+1)*n2)/n1)*abs(b)^(n3/n1)*m^2*n1*n3)*cos((m*t)/4)^4)*abs(sin((m*t)/4))^(2*n3)+((abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n2-abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n2^2)*sin((m*t)/4)^4+((((-2*abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1)-2*abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2)*n2+abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1)*n3+abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n2)*cos((m*t)/4)^2*sin((m*t)/4)^2+(abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n3-abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n3^2)*cos((m*t)/4)^4)*abs(cos((m*t)/4))^n2*abs(sin((m*t)/4))^n3+((abs(a)^(n2/n1)*abs(b)^(((2*n1+1)*n3)/n1)*m^2*n2^2+abs(a)^(n2/n1)*abs(b)^(((2*n1+1)*n3)/n1)*m^2*n1*n2)*sin((m*t)/4)^4+abs(a)^(n2/n1)*abs(b)^(((2*n1+1)*n3)/n1)*m^2*n1*n2*cos((m*t)/4)^2*sin((m*t)/4)^2)*abs(cos((m*t)/4))^(2*n2))/((abs(a)^n2*abs(sin((m*t)/4))^n3+abs(b)^n3*abs(cos((m*t)/4))^n2)^(1/n1)*(16*abs(a)^(2*n2)*n1^2*cos((m*t)/4)^2*sin((m*t)/4)^2*abs(sin((m*t)/4))^(2*n3)+32*abs(a)^n2*abs(b)^n3*n1^2*cos((m*t)/4)^2*sin((m*t)/4)^2*abs(cos((m*t)/4))^n2*abs(sin((m*t)/4))^n3+16*abs(b)^(2*n3)*n1^2*cos((m*t)/4)^2*sin((m*t)/4)^2*abs(cos((m*t)/4))^(2*n2)))";

function isOperator(chr) {
  return (
    chr === "+" ||
    chr === "-" ||
    chr === "*" ||
    chr === "/" ||
    chr === "," ||
    chr === ")"
  );
}

function replacePower(string) {
  const powerString = "pow({0},{1})";
  let i = 0;
  const length = string.length;

  while (i < length) {
    if (string[i] === "^") {
      let before = "";
      let after = "";
      let j;

      // Find the 'before' part
      if (string[i - 1] === ")") {
        let parenthesesCount = 1;
        for (j = i - 2; j >= 0; j--) {
          if (string[j] === ")") parenthesesCount++;
          if (string[j] === "(") parenthesesCount--;
          if (parenthesesCount === 0) {
            // Check if there's a function
            if (j >= 3 && ["abs", "sin", "cos"].includes(string.substring(j - 3, j))) {
              j -= 3;
            }
            break;
          }
        }
        before = string.substring(j, i);
      } else {
        for (j = i - 1; j >= 0; j--) {
          if (isOperator(string[j])) break;
        }
        before = string.substring(j + 1, i);
      }

      // Find the 'after' part
      if (string[i + 1] === "(") {
        let parenthesesCount = 1;
        for (j = i + 2; j < length; j++) {
          if (string[j] === "(") parenthesesCount++;
          if (string[j] === ")") parenthesesCount--;
          if (parenthesesCount === 0) break;
        }
        after = string.substring(i + 1, j + 1);
      } else {
        for (j = i + 1; j < length; j++) {
          if (isOperator(string[j])) break;
        }
        after = string.substring(i + 1, j);
      }

      const replacement = powerString
        .replace("{0}", before)
        .replace("{1}", after);
      string =
        string.slice(0, i - before.length) +
        replacement +
        string.slice(i + after.length + 1);
      i += replacement.length - before.length - after.length - 1;
    }
    i++;
  }
  return string;
}

console.log(replacePower(testStr));
