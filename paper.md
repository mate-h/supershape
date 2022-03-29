# Contiouos curvature on 2D surfaces for UI design

Superformula definition:

```tex
r\left(\theta\right) =
\left(
        \left|
                \frac{\cos\left(\frac{m\theta}{4}\right)}{a}
        \right| ^{n_2}
+
        \left|
                \frac{\sin\left(\frac{m\theta}{4}\right)}{b}
        \right| ^{n_3}
\right) ^{-\frac{1}{n_{1}}}
```

Curvature definition:

```tex
{\kappa (\theta )={\frac {\left|r^{2}+2{r'}^{2}-r\,r''\right|}{\left(r^{2}+{r'}^{2}\right)^{\frac {3}{2}}}}}
```

In order to minimize the total curvature of the entire curve, let's minimize the definite integral of the curvature function over the range of 0 to 2 PI, subject to the constraint that the curvature is non-negative and that the integral is less than or equal to 1 (the maximum curvature of a superformula when m = n = 1).

```
\int_{0}^{2\pi} {\kappa (\theta )} d\theta > 0
```

((abs(cos(t))^4) + (abs(sin(t))^4))^(-1/n1)
```tex

r(t) = 1/((\left|\cos\left(t\right)\right|^4) + (\left|\sin\left(t\right)\right|^4))^{\frac{1}{4}}
```

-(4*cos(t)*sin(t)^3-4*cos(t)^3*sin(t))/((sin(t)^4+cos(t)^4)^(1/n1)*(n1*sin(t)^4+n1*cos(t)^4))
```tex
r'(t) = -\frac{4\cos\left(t\right)\sin\left(t\right)^3-4\cos\left(t\right)^3\sin\left(t\right)}{\left(\sin\left(t\right)^4+\cos\left(t\right)^4\right)^{\frac{1}{4}}\left(n_{1}\sin\left(t\right)^4+n_{1}\cos\left(t\right)^4\right)}
```

(4*n1*sin(t)^8+(16-8*n1)*cos(t)^2*sin(t)^6+((-24*n1)-32)*cos(t)^4*sin(t)^4+(16-8*n1)*cos(t)^6*sin(t)^2+4*n1*cos(t)^8)/((sin(t)^4+cos(t)^4)^(1/n1)*(n1^2*sin(t)^8+2*n1^2*cos(t)^4*sin(t)^4+n1^2*cos(t)^8))


ORIGINAL
abs((((abs(c)^4) + (abs(s)^4))^(-1/n1))^2+2*(-(4*c*s^3-4*c^3*s)/((s^4+c^4)^(1/n1)*(n1*s^4+n1*c^4)))^2-(((abs(c)^4) + (abs(s)^4))^(-1/n1))*((4*n1*s^8+(16-8*n1)*c^2*s^6+((-24*n1)-32)*c^4*s^4+(16-8*n1)*c^6*s^2+4*n1*c^8)/((s^4+c^4)^(1/n1)*(n1^2*s^8+2*n1^2*c^4*s^4+n1^2*c^8))))/((((abs(c)^4) + (abs(s)^4))^(-1/n1))^2 + (-(4*c*s^3-4*c^3*s)/((s^4+c^4)^(1/n1)*(n1*s^4+n1*c^4)))^2)^1.5

Simplified
((s^4+c^4)^(1/n)*(n*s^4+c^4*n)*abs((n^2-4*n)*s^8+(8*c^2*n+16*c^2)*s^6+(2*c^4*n^2+24*c^4*n-32*c^4)*s^4+(8*c^6*n+16*c^6)*s^2+c^8*n^2-4*c^8*n))/(n^2*s^8+16*c^2*s^6+(2*c^4*n^2-32*c^4)*s^4+16*c^6*s^2+c^8*n^2)^(3/2)

cos/sin back
((sin(t)^4+cos(t)^4)^(1/n1)*(n1*sin(t)^4+cos(t)^4*n1)*abs((n1^2-4*n1)*sin(t)^8+(8*cos(t)^2*n1+16*cos(t)^2)*sin(t)^6+(2*cos(t)^4*n1^2+24*cos(t)^4*n1-32*cos(t)^4)*sin(t)^4+(8*cos(t)^6*n1+16*cos(t)^6)*sin(t)^2+cos(t)^8*n1^2-4*cos(t)^8*n1))/(n1^2*sin(t)^8+16*cos(t)^2*sin(t)^6+(2*cos(t)^4*n1^2-32*cos(t)^4)*sin(t)^4+16*cos(t)^6*sin(t)^2+cos(t)^8*n1^2)^(3/2)

Solve simplified for n (discard negative root)

n1 = (2*sqrt(s^16-8*c^2*s^14+8*c^6*s^10+62*c^8*s^8+8*c^10*s^6-8*c^14*s^2+c^16)+2*s^8-4*c^2*s^6-12*c^4*s^4-4*c^6*s^2+2*c^8)/(s^8+2*c^4*s^4+c^8)

n1 = (2*Math.sqrt(s**16-8*c**2*s**14+8*c**6*s**10+62*c**8*s**8+8*c**10*s**6-8*c**14*s**2+c**16)+2*s**8-4*c**2*s**6-12*c**4*s**4-4*c**6*s**2+2*c**8)/(s**8+2*c**4*s**4+c**8)