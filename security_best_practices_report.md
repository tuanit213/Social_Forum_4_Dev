# Security Best Practices Report

## TÃ³m táº¯t

ÄÃ£ kiá»ƒm tra code backend Express/Mongoose vÃ  frontend React/Vite. KhÃ´ng tháº¥y dáº¥u hiá»‡u DLL injection, command injection, `eval`, `child_process`, `spawn`, `exec`, `LoadLibrary`, hoáº·c import `.dll` trong source app. Backend Ä‘Ã£ cÃ³ nhiá»u cáº¥u hÃ¬nh tá»‘t: `helmet`, táº¯t `x-powered-by`, giá»›i háº¡n body `100kb`, CORS allowlist, rate limit auth, JWT secret qua env, cookie refresh `HttpOnly/SameSite=Strict`, Mongoose `sanitizeFilter`.

Rá»§i ro cáº§n xá»­ lÃ½ chÃ­nh: frontend dependency `react-router` Ä‘ang bá»‹ `npm audit` bÃ¡o high, CSP Ä‘ang táº¯t/khÃ´ng tháº¥y cáº¥u hÃ¬nh cho frontend, endpoint máº«u public cÃ²n má»Ÿ, vÃ  endpoint cookie auth chÆ°a cÃ³ CSRF/Origin validation rÃµ rÃ ng.

## Endpoint hiá»‡n cÃ³

| Endpoint | Method | Auth | Ghi chÃº |
|---|---:|---|---|
| `/` | GET | Public | Health/basic API message |
| `/api/sample` | GET | Public | Dá»¯ liá»‡u máº«u |
| `/api/sample` | POST | Public | Endpoint máº«u, nháº­n `title` |
| `/api/auth/signup` | POST | Public | CÃ³ Zod validation, rate limit qua `/api/auth` |
| `/api/auth/signin` | POST | Public | CÃ³ Zod validation, bcrypt, rate limit |
| `/api/auth/signout` | POST | Cookie | Clear refresh cookie, chÆ°a cÃ³ Origin/CSRF check riÃªng |
| `/api/auth/refresh` | POST | Cookie | Verify refresh cookie, cáº¥p access token má»›i |
| `/api/users/profile` | GET | Bearer token | CÃ³ `verifyToken` |
| `/api/users/me/dashboard` | GET | Bearer token | CÃ³ `verifyToken` |
| `/api/users/me/dashboard` | PUT | Bearer token | CÃ³ `verifyToken` + Zod validation |

## Findings

### S1. Frontend dependency cÃ³ advisory high

Rule ID: REACT-SUPPLY-001
Severity: High
Location: `Frontend/package.json:22`, `Frontend/package-lock.json:20`
Evidence:

```text
react-router-dom: ^7.18.1
npm audit: React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response
```

Impact: Dependency scanner bÃ¡o high severity trÃªn `react-router`. App hiá»‡n lÃ  SPA BrowserRouter, chÆ°a tháº¥y dÃ¹ng RSC mode, nÃªn kháº£ nÄƒng exploit trá»±c tiáº¿p cáº§n xÃ¡c minh thÃªm. DÃ¹ váº­y, Ä‘Ã¢y váº«n lÃ  dependency security finding cáº§n ghi nháº­n trong bÃ¡o cÃ¡o.

Fix: Theo dÃµi báº£n vÃ¡ `react-router/react-router-dom`; khÃ´ng cháº¡y `npm audit fix --force` vá»™i vÃ¬ npm Ä‘á» xuáº¥t downgrade/breaking change. Náº¿u dá»± Ã¡n khÃ´ng dÃ¹ng RSC/Data action server-side, ghi rÃµ false-positive scope trong bÃ¡o cÃ¡o triá»ƒn khai.

Mitigation: Báº­t GitHub Dependabot hoáº·c cháº¡y `npm audit` trong CI, chá»‰ merge dependency upgrade sau khi build/test pass.

False positive notes: Cáº§n xÃ¡c nháº­n app khÃ´ng báº­t React Router RSC mode/server actions.

### S2. CSP Ä‘ang bá»‹ táº¯t á»Ÿ backend vÃ  chÆ°a tháº¥y CSP cho frontend

Rule ID: EXPRESS-HEADERS-001 / REACT-CSP-001
Severity: Medium
Location: `Backend/server.js:24-25`, `Frontend/index.html:1-11`
Evidence:

```js
helmet({
  contentSecurityPolicy: false,
})
```

Impact: Social/forum app hiá»ƒn thá»‹ dá»¯ liá»‡u do ngÆ°á»i dÃ¹ng nháº­p. Náº¿u cÃ³ XSS á»Ÿ má»™t component hiá»‡n táº¡i hoáº·c tÆ°Æ¡ng lai, thiáº¿u CSP lÃ m tÄƒng tÃ¡c Ä‘á»™ng: Ä‘á»c localStorage user state, gá»i API báº±ng token Ä‘ang á»Ÿ memory context, hoáº·c chuyá»ƒn hÆ°á»›ng ngÆ°á»i dÃ¹ng.

Fix: Báº­t CSP thá»±c táº¿ á»Ÿ layer phá»¥c vá»¥ frontend hoáº·c reverse proxy. Backend API cÃ³ thá»ƒ giá»¯ CSP nháº¹, nhÆ°ng frontend production cáº§n header nhÆ° `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`.

Mitigation: Báº¯t Ä‘áº§u báº±ng CSP report-only trÃªn mÃ´i trÆ°á»ng test, sau Ä‘Ã³ enforce.

False positive notes: Náº¿u production dÃ¹ng Nginx/Cloudflare/Vercel set CSP á»Ÿ edge thÃ¬ verify báº±ng response headers runtime.

### S3. Cookie-auth endpoints thiáº¿u CSRF/Origin validation riÃªng

Rule ID: EXPRESS-CSRF-001 / REACT-CSRF-001
Severity: Medium
Location: `Backend/routes/authRoute.js:14`, `Backend/routes/authRoute.js:17`, `Backend/utils/securityConfig.js:27-30`, `Frontend/src/services/authService.js:41`, `Frontend/src/services/authService.js:80`, `Frontend/src/services/authService.js:132`
Evidence:

```js
router.post("/signout", signOut);
router.post("/refresh", refreshToken);

sameSite: "strict";
path: "/api/auth";

withCredentials: true;
```

Impact: `SameSite=Strict`, CORS allowlist, vÃ  refresh cookie path Ä‘Ã£ giáº£m rá»§i ro lá»›n. Tuy nhiÃªn `/auth/refresh` vÃ  `/auth/signout` váº«n lÃ  POST dá»±a trÃªn cookie nhÆ°ng chÆ°a cÃ³ Origin/Referer validation hoáº·c CSRF token/custom header báº¯t buá»™c. Náº¿u cáº¥u hÃ¬nh cookie thay Ä‘á»•i vá» `Lax/None`, hoáº·c app Ä‘Æ°á»£c nhÃºng/cháº¡y qua subdomain phá»©c táº¡p, endpoint dá»… yáº¿u hÆ¡n.

Fix: ThÃªm middleware kiá»ƒm `Origin`/`Referer` cho cookie-auth endpoints vÃ  yÃªu cáº§u custom header nhÆ° `X-CSRF-Intent: auth` cho `/refresh` vÃ  `/signout`. Cáº­p nháº­t CORS `allowedHeaders` náº¿u thÃªm header.

Mitigation: Giá»¯ `SameSite=Strict`, `HttpOnly`, path háº¹p `/api/auth`, khÃ´ng Ä‘á»•i `SameSite=None` trá»« khi cÃ³ CSRF token.

False positive notes: Vá»›i `SameSite=Strict` hiá»‡n táº¡i, classic cross-site CSRF khÃ³ khai thÃ¡c trÃªn browser hiá»‡n Ä‘áº¡i.

### S4. Endpoint máº«u public cÃ²n má»Ÿ trong production surface

Rule ID: EXPRESS-INPUT-001 / EXPRESS-AUTHZ-001
Severity: Low
Location: `Backend/server.js:60`, `Backend/routes/sampleRoutes.js:10-12`, `Backend/controllers/sampleController.js:25-40`
Evidence:

```js
app.use("/api/sample", sampleRoutes);
router.route('/').get(getSample).post(createSample);
message: `ÄÃ£ táº¡o thÃ nh cÃ´ng dá»¯ liá»‡u: ${title}`;
```

Impact: Endpoint máº«u khÃ´ng lÆ°u DB vÃ  chá»‰ tráº£ JSON, chÆ°a pháº£i lá»— há»•ng nghiÃªm trá»ng. NhÆ°ng public POST demo lÃ m tÄƒng attack surface, gÃ¢y nhiá»…u logs/rate-limit, vÃ  dá»… bá»‹ dÃ¹ng nháº§m khi production má»Ÿ API.

Fix: XÃ³a route `/api/sample` khá»i production hoáº·c chá»‰ báº­t khi `NODE_ENV !== "production"`.

Mitigation: Náº¿u giá»¯ route demo, thÃªm validation schema cho `title`, rate limit riÃªng, vÃ  khÃ´ng mount trong production.

False positive notes: Náº¿u Ä‘Ã¢y chá»‰ lÃ  lab/local endpoint thÃ¬ impact tháº¥p.

### S5. URL profile chÆ°a cÃ³ allowlist/URL validation cháº·t

Rule ID: REACT-URL-001 / EXPRESS-INPUT-001
Severity: Low
Location: `Backend/middlewares/validateUserRequest.js:35-37`, `Backend/models/User.js:29`, `Backend/models/User.js:76-90`, `Frontend/src/components/layout/Navbar.jsx:46`, `Frontend/src/components/widgets/UserProfileWidget.jsx:17`, `Frontend/src/pages/ProfileDashboard.jsx:499`, `Frontend/src/pages/ProfileDashboard.jsx:676`
Evidence:

```js
websiteUrl: trimmedText(180),
facebookUrl: trimmedText(180),
socialLinks: socialLinkList,
avatarUrl: { type: String }
<img src={user.avatarUrl} ... />
```

Impact: Hiá»‡n website/social links chá»§ yáº¿u hiá»ƒn thá»‹ text, khÃ´ng tháº¥y Ä‘Æ°a vÃ o `<a href>`. `avatarUrl` Ä‘Æ°á»£c dÃ¹ng trong `<img src>`, cÃ³ thá»ƒ táº¡o request tá»›i host ngoÃ i, tracking ngÆ°á»i dÃ¹ng, mixed-content, hoáº·c lá»—i render náº¿u URL khÃ´ng há»£p lá»‡. Khi sau nÃ y cÃ³ upload/avatar edit, field nÃ y cáº§n khÃ³a cháº·t.

Fix: DÃ¹ng Zod URL validation/allowlist protocol `https:` cho `websiteUrl`, `facebookUrl`, `socialLinks`, `avatarUrl`; vá»›i avatar nÃªn Æ°u tiÃªn upload server-side, lÆ°u Cloudinary/S3 URL Ä‘Ã£ kiá»ƒm soÃ¡t.

Mitigation: Náº¿u chÆ°a lÃ m upload, khÃ´ng cho client sá»­a `avatarUrl` trá»±c tiáº¿p.

False positive notes: ChÆ°a tháº¥y endpoint hiá»‡n táº¡i cho user tá»± update `avatarUrl`.

## KhÃ´ng phÃ¡t hiá»‡n

- KhÃ´ng tháº¥y DLL injection pattern trong source app: khÃ´ng cÃ³ `.dll`, `LoadLibrary`, `DllImport`, `ffi`, `edge-js`.
- KhÃ´ng tháº¥y OS command injection sink: khÃ´ng cÃ³ `child_process`, `exec`, `execSync`, `spawn`, `fork`.
- KhÃ´ng tháº¥y frontend raw HTML sink: khÃ´ng cÃ³ `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`, `new Function`.
- KhÃ´ng tháº¥y open redirect trá»±c tiáº¿p tá»« query param. `window.location.href` chá»‰ set vá» `"/login"`.
- KhÃ´ng tháº¥y `.env` bá»‹ git track. `Backend/.gitignore` cÃ³ `.env`.
- Backend `npm audit --omit=dev --audit-level=low`: `0 vulnerabilities`.

## Äiá»ƒm Ä‘Ã£ lÃ m tá»‘t

- `Backend/server.js:21`: táº¯t `x-powered-by`.
- `Backend/server.js:24`: cÃ³ `helmet`.
- `Backend/server.js:29-30`: body parser cÃ³ limit.
- `Backend/server.js:34-45`: CORS dÃ¹ng allowlist, cÃ³ credentials.
- `Backend/server.js:48-54`: auth routes cÃ³ rate limit.
- `Backend/config/db.js:4-6`: Mongoose báº­t `sanitizeFilter` vÃ  `strictQuery`.
- `Backend/utils/securityConfig.js:3-13`: JWT secret báº¯t buá»™c qua env vÃ  check Ä‘á»™ dÃ i production.
- `Backend/utils/securityConfig.js:27-30`: refresh cookie `HttpOnly`, `Secure` khi production, `SameSite=Strict`.
- `Frontend/src/services/authService.js:1-132`: access token giá»¯ trong memory, legacy `localStorage` token bá»‹ xÃ³a.

## Lá»‡nh Ä‘Ã£ cháº¡y

```powershell
rg --files
rg -n "helmet|cors|rateLimit|csrf|res.cookie|jwt|bcrypt|express.json|..." Backend
rg -n "dangerouslySetInnerHTML|innerHTML|eval|window.location|localStorage|..." Frontend
rg -n "child_process|exec|spawn|LoadLibrary|.dll|insecureHTTPParser|--inspect|eval" .
npm audit --omit=dev --audit-level=low
git ls-files | rg "(^|/)\\.env($|\\.)"
```

## Æ¯u tiÃªn xá»­ lÃ½

1. Triage `react-router` advisory, nÃ¢ng/cá»‘ Ä‘á»‹nh version phÃ¹ há»£p khi cÃ³ báº£n vÃ¡ an toÃ n.
2. Báº­t CSP cho frontend production.
3. ThÃªm Origin/CSRF validation cho `/api/auth/refresh` vÃ  `/api/auth/signout`.
4. XÃ³a hoáº·c táº¯t `/api/sample` khi production.
5. ThÃªm URL validation cho profile/avatar fields trÆ°á»›c khi má»Ÿ tÃ­nh nÄƒng upload/avatar edit.
