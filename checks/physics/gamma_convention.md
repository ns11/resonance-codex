# Γ convention check (two-atom model)

This is the numerical model behind the finding about thesis (3.48) in the project doc: the master equation (3.47) and the rates (3.55) are consistent only with Γ = A, Scully's Γ.
How close the check comes depends on the parameters. The population rates and sideband widths of the secular model agree with this two-atom model to within 0.5% only for delta much smaller than Omega (delta/Omega about 0.015, for example 4000 3000 60). At the script defaults (200 150 30) and at 2000 1500 300 the deviations are 2 to 5% (2Gamma1 about -2.0%, 2Gamma2 about +5.0%, Gamma_e about -2.5%, Gamma_s about +1.3%, and the steady-state symmetric population about +12.8%). They are not a function of delta/Omega alone: for the same delta/Omega they grow with theta (0.75% at Delta = 0, about 5% at Delta = 0.75 Omega), and near the magic angle they also depend on delta/Gamma (Omega = 200, delta = 3: 1.8% at Delta = 0.75 Omega, 11.9% at Delta = 1.2 Omega, where |delta~| >> Gamma fails). They come from the non-secular dipole-dipole part of the model, not from the choice of Gamma. With Gamma = A/2 every rate is off by a factor of about 2 in every run, so the conclusion about the convention does not depend on the parameters.

The artifact cannot serve `.py` files, so the script is kept here. Copy the code below into `gamma_convention.py` and run `python3 gamma_convention.py [Omega Delta delta]` (needs numpy).

```python
# Check which Gamma convention the thesis master equation (3.47) and rates (3.55) correspond to.
# Microscopic model: two atoms, Dicke limit, collective decay with single-atom population rate A:
#   d rho/dt = -i[H,rho] - (A/2)(S+S- rho + rho S+S- - 2 S- rho S+),  S- = s1- + s2-
# H (thesis 3.1, rotating frame): sum_j (Delta/2) sz_j + Omega (s+_j + s-_j)  - delta (s1+ s2- + s2+ s1-)
# Usage: python3 gamma_convention.py [Omega Delta delta]   (in units of A; default 200 150 30)
# Earlier runs also used 2000 1500 300 and 4000 3000 60.
import sys
import numpy as np
A=1.0
Om, De, de = (float(x) for x in sys.argv[1:4]) if len(sys.argv) >= 4 else (200.0, 150.0, 30.0)
sm=np.array([[0,0],[1,0]],dtype=complex)   # basis (e,g): |g><e|
sz=np.diag([1,-1]).astype(complex); I2=np.eye(2)
k=np.kron
s1=k(sm,I2); s2=k(I2,sm); Sm=s1+s2; Sp=Sm.conj().T
H=(De/2)*(k(sz,I2)+k(I2,sz))+Om*(s1+s1.conj().T+s2+s2.conj().T)-de*(s1.conj().T@s2+s2.conj().T@s1)
d=4; Id=np.eye(d)
def spre(X): return k(X,Id)
def spost(X): return k(Id,X.T)
L=-1j*(spre(H)-spost(H))
L+= -(A/2)*(spre(Sp@Sm)+spost(Sp@Sm)-2*spre(Sm)@spost(Sp))
ev=np.linalg.eigvals(L)
real_like=sorted([e for e in ev if abs(e.imag)<1.0], key=lambda e:-e.real)
print("eigenvalues with |Im|<1:", np.round(real_like,4))
Ot=np.sqrt(Om**2+De**2/4); c2t=De/(2*Ot); s2t=Om/Ot
c2=(1+c2t)/2; s2=(1-c2t)/2; cs=c2*s2
for G,label in [(A,'Gamma=A (Scully)'),(A/2,'Gamma=A/2 (thesis 3.48 formula)')]:
    print(label, ' 2Gamma1=',round(2*G*(1-cs),4),' 2Gamma2=',round(2*G*(1-3*cs),4))
# sideband coherence decay: Gamma_e=Gamma(1/2 sin^2 2t + 2c^4 + s^4)
for G,label in [(A,'Gamma=A'),(A/2,'Gamma=A/2')]:
    print(label,' Gamma_e=',round(G*(0.5*s2t**2+2*c2**2+s2**2),4),' Gamma_s=',round(G*(0.5*s2t**2+c2**2+2*s2**2),4))
dt=de*(3*c2t**2-1)/2   # delta-tilde = delta*P2(cos 2theta); the sideband window must be wider than |delta-tilde|
side=sorted([e for e in ev if abs(abs(e.imag)-2*Ot)<abs(dt)+10], key=lambda e:e.imag)
print("sideband eigenvalues (Im near +-2*Omega~):", np.round(side,4))
# steady state check vs sin^8 : sin^4cos^4 : cos^8 in dressed basis (the null space of L is two-dimensional, because of the dark |A>,
# so the state is taken from |gg> below, not from the eigenvector of the smallest eigenvalue)
# dressed single-atom states (thesis 3.11-3.12): |e~>=cos t|e>+sin t|g>, |g~>=-sin t|e>+cos t|g>
th=np.arctan2(s2t,c2t)/2; c=np.cos(th); s=np.sin(th)
et=np.array([c,s]); gt=np.array([-s,c])
E=k(et,et); G_=k(gt,gt); S=(k(et,gt)+k(gt,et))/np.sqrt(2)
Z=s**8+s**4*c**4+c**8
print("detailed balance pred PE,PS,PG =",round(s**8/Z,4),round(s**4*c**4/Z,4),round(c**8/Z,4))
# steady state reached from |gg> (stays in the symmetric sector, so the dark |A> does not mix in)
try:
    from scipy.linalg import expm
    gg=k(np.array([0,1.]),np.array([0,1.])); r0=np.outer(gg,gg).astype(complex).reshape(-1)
    rho=(expm(L*60.0)@r0).reshape(d,d)
    PE=np.real(E.conj()@rho@E); PS=np.real(S.conj()@rho@S); PG=np.real(G_.conj()@rho@G_)
    print("steady state from |gg>  PE,PS,PG =",round(PE,4),round(PS,4),round(PG,4))
except Exception as ex:
    print("scipy missing:",ex)
```
