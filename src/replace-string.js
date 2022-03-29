// replace ^ with pow() in string
let str =
  "((abs(a)^(((2*n1+1)*n2)/n1)*abs(b)^(n3/n1)*m^2*n1*n3*cos((m*t)/4)^2*sin((m*t)/4)^2+(abs(a)^(((2*n1+1)*n2)/n1)*abs(b)^(n3/n1)*m^2*n3^2+abs(a)^(((2*n1+1)*n2)/n1)*abs(b)^(n3/n1)*m^2*n1*n3)*cos((m*t)/4)^4)*abs(sin((m*t)/4))^(2*n3)+((abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n2-abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n2^2)*sin((m*t)/4)^4+((((-2*abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1)-2*abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2)*n2+abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1)*n3+abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n2)*cos((m*t)/4)^2*sin((m*t)/4)^2+(abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n3-abs(a)^(((n1+1)*n2)/n1)*abs(b)^(((n1+1)*n3)/n1)*m^2*n1*n3^2)*cos((m*t)/4)^4)*abs(cos((m*t)/4))^n2*abs(sin((m*t)/4))^n3+((abs(a)^(n2/n1)*abs(b)^(((2*n1+1)*n3)/n1)*m^2*n2^2+abs(a)^(n2/n1)*abs(b)^(((2*n1+1)*n3)/n1)*m^2*n1*n2)*sin((m*t)/4)^4+abs(a)^(n2/n1)*abs(b)^(((2*n1+1)*n3)/n1)*m^2*n1*n2*cos((m*t)/4)^2*sin((m*t)/4)^2)*abs(cos((m*t)/4))^(2*n2))/((abs(a)^n2*abs(sin((m*t)/4))^n3+abs(b)^n3*abs(cos((m*t)/4))^n2)^(1/n1)*(16*abs(a)^(2*n2)*n1^2*cos((m*t)/4)^2*sin((m*t)/4)^2*abs(sin((m*t)/4))^(2*n3)+32*abs(a)^n2*abs(b)^n3*n1^2*cos((m*t)/4)^2*sin((m*t)/4)^2*abs(cos((m*t)/4))^n2*abs(sin((m*t)/4))^n3+16*abs(b)^(2*n3)*n1^2*cos((m*t)/4)^2*sin((m*t)/4)^2*abs(cos((m*t)/4))^(2*n2)))";

// Private Function _replacePower(Str As String) As String
//   Const PowerString As String = "Pow({0},{1})"

//   Dim i, j As Integer
//   Dim c As Char
//   Dim before, after, all As String
//   Dim length As Integer = Str.Length
//   Dim other_p As Integer 'Keep track of other opening/closing parenthesis, to avoid breaking for a nested one.

//   other_p = -1
//   i = 1
//   While i <= length
//       c = Str(i)
//       If c = "^"c Then
//           If Str(i - 1) = ")"c Then
//               j = i - 1
//               Do While Str(j) <> "("c Or other_p > 0
//                   If Str(j) = ")"c Then other_p = other_p + 1
//                   If Str(j) = "("c Then other_p = other_p - 1
//                   j = j - 1
//               Loop
//               before = Mid(Str, j, i - j)
//           Else
//               j = i - 1
//               'The expression to be raised is everything between the power and + - * / , ( <- Opening parenthesis is not ok if there is no closing one, and this case is handled above.
//               Do While (Not isOperator(Str(j)))
//                   j = j - 1
//                   If j = 0 Then Exit Do
//               Loop
//               before = Mid(Str, j + 1, i - j - 1)
//           End If

//           other_p = -1

//           If Str(i + 1) = "("c Or other_p > 0 Then
//               j = i + 1
//               Do While Str(j) <> ")"c
//                   If Str(j) = ")"c Then other_p = other_p - 1
//                   If Str(j) = "("c Then other_p = other_p + 1
//                   j = j + 1
//               Loop
//               after = Mid(Str, i + 1, j - i)
//           Else
//               j = i + 1
//               Do While (Not isOperator(Str(j)))
//                   j = j + 1
//                   If j = length + 1 Then Exit Do
//               Loop
//               after = Mid(Str, i + 1, j - i - 1)
//           End If

//           all = before & "^" & after
//           Str = Replace(Str, all, String.Format(PowerString, before, after))
//           i = 1
//       End If
//       i = i + 1
//   End While
//   Return Str
// End Function

// Private Function isOperator(chr As Char) As Boolean
//   Return chr = "+"c OrElse chr = "-"c OrElse chr = "*"c OrElse chr = "/"c OrElse chr = ","c OrElse chr = ")"c
// End Function

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
  var powerString = "pow({0},{1})";
  var i = 0;
  var j = 0;
  var c = "";
  var before = "";
  var after = "";
  var all = "";
  var length = string.length;
  var other_p = 0; //Keep track of other opening/closing parenthesis, to avoid breaking for a nested one.

  other_p = -1;
  i = 1;
  while (i <= length) {
    // console.log("s0");
    c = string[i];
    if (c === "^") {
      if (string[i - 1] === ")") {
        j = i - 1;
        do {
          console.log("s1");
          if (string[j] === ")") other_p = other_p + 1;
          if (string[j] === "(") other_p = other_p - 1;
          j = j - 1;
        } while ((string[j] !== "(" || other_p > 0) && j > 0);
        before = string.substring(j + 1, i - 1);
      } else {
        j = i - 1;
        //The expression to be raised is everything between the power and + - * / , ( <- Opening parenthesis is not ok if there is no closing one, and this case is handled above.
        do {
          console.log("s2");
          if (isOperator(string[j])) j = j - 1;
          else break;
        } while (true);
        before = string.substring(j + 1, i - 1);
      }

      other_p = -1;

      if (string[i + 1] === "(" || other_p > 0) {
        j = i + 1;
        do {
          console.log("s3");
          if (string[j] === ")" && other_p > 0) other_p = other_p - 1;
          if (string[j] === "(") other_p = other_p + 1;
          j = j + 1;
        } while ((string[j] !== ")" || other_p > 0) && j < length);
        after = string.substring(i + 1, j - 1);
      } else {
        j = i + 1;
        do {
          console.log("s4");
          if (isOperator(string[j])) j = j + 1;
          else break;
        } while (true);
        after = string.substring(i + 1, j - 1);
      }

      all = before + "^" + after;
      console.log(all);
      string = string.replace(
        all,
        powerString.replace("{0}", before).replace("{1}", after)
      );
      i = 1;
    }
    i = i + 1;
    console.log(i);
  }
  return string;
}

console.log(replacePower("(2+3)^(4+5)"));
