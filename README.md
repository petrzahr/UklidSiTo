# 🧹 UklidSiTo

> **"Domácnost sama se neuklidí."**

**UklidSiTo** je moderní, soukromá webová aplikace pro rychlou a hravou správu domácích úklidových úkolů. 

Správce domácnosti (administrátor) jednoduše vybere úkol, zvolí provinilce z **Úklidové čety** (např. *Eva*, *Anna*), volitelně přidá místnost či termín, a zadá úkol. Dotyčný člen domácnosti obdrží e-mail s jednorázovým zabezpečeným odkazem a tlačítkem pro potvrzení splnění.

---

## 🌟 Klíčové vlastnosti a architektura

- **Žádné účty pro členy domácnosti**: Členové úklidové čety se nepřihlašují ani neregistrují. Úkoly potvrzují jednorázovým kliknutím na zabezpečený odkaz v e-mailu.
- **Bezpečnostní odkaz (read-only GET)**: Otevření odkazu z e-mailu (`GET /task/<token>`) úkol **nikdy** neoznačí jako splněný (ochrana proti automatickým antivirovým a e-mailovým robotům). Splnění vyžaduje explicitní kliknutí (`POST /api/tasks/complete`).
- **Kryptografické tokeny**: V Google Sheets se nikdy neukládají surové tokeny, ale pouze jejich kryptografický hash `SHA-256(token)`.
- **Rotace tokenu při přeřazení**: Pokud administrátor změní řešitele úkolu, původní odkaz je okamžitě zneplatněn a nový řešitel obdrží nový unikátní odkaz.
- **Idempotence**: Opakované otevření či potvrzení již splněného úkolu nepřepisuje původní datum splnění a bezpečně zobrazí hravou potvrzovací obrazovku.
- **Přísná izolace prostředí**:
  - **PROD**: Používá produkční Google tabulku (`GOOGLE_SHEET_ID_PROD`) a e-maily odesílá na reálné adresy.
  - **DEV / PREVIEW**: Používá výhradně testovací tabulku (`GOOGLE_SHEET_ID_TEST`) a **veškeré** odchozí e-maily přesměrovává na `TEST_EMAIL_RECIPIENT`. Nikdy nemůže dojít k nechtěnému odeslání testovacích e-mailů rodině.
- **Trvalé snapshoty**: Úkoly si ukládají snapshot názvu úkolu, místnosti i jména/e-mailu řešitele v době zadání. Historie zůstává 100% čitelná i po pozdějším přejmenování či deaktivaci předvoleb nebo členů.
- **Hravá osobnost**: Vtipné hlášky v češtině ("Co je zase potřeba uklidit?", "Kdo to schytá?", "Pachatel byl informován.", "✅ Uklizeno!").

---

## 🛠️ Použitý technologický stack

- **Next.js 15+ (App Router)** s React 19 a TypeScriptem
- **Tailwind CSS** pro mobilní responsivní design (large touch targets, optimalizováno pro ovládání jednou rukou)
- **NextAuth.js** s Google OAuth (přístup povolen výhradně pro `ADMIN_EMAIL`)
- **Google Sheets API v4** (přes Google Service Account jako bezdatabázové cloudové úložiště)
- **Resend** pro transakční HTML e-maily
- **Vitest** pro automatizované unit a integrační testy

---

## 📂 Struktura projektu

```text
UklidSiTo/
├── src/
│   ├── app/
│   │   ├── actions/                  # Server Actions (úkoly, nastavení, bootstrap)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # Google OAuth callback
│   │   │   └── tasks/complete/       # Explicitní POST endpoint pro dokončení
│   │   ├── login/                    # Přihlášení administrátora přes Google
│   │   ├── settings/                 # Nastavení (četa, úkoly, místnosti, systém)
│   │   ├── task/[token]/             # Veřejná read-only stránka pro potvrzení
│   │   ├── tasks/new/                # Rychlé zadání úkolu (karty, oběti, detaily)
│   │   ├── tasks/[id]/edit/          # Úprava úkolu, rotace tokenu a storno
│   │   ├── layout.tsx                # Globální layout s DEV/TEST bannerem
│   │   └── page.tsx                  # Dashboard administrátora (přehledy, filtry)
│   ├── components/                   # UI komponenty (Header, TaskCard, Formy)
│   ├── lib/
│   │   ├── auth/                     # NextAuth konfigurace a session guard
│   │   ├── config/                   # Centralizovaná konfigurace (striktní izolace)
│   │   ├── security/                 # Generování tokenů a SHA-256 verifikace
│   │   └── validation/               # Zod schémata pro validaci vstupů
│   ├── repositories/                 # Datová vrstva (Google Sheets & In-Memory Store)
│   ├── services/                     # Aplikační logika (TaskService, EmailService, ...)
│   └── types/                        # Doménové TypeScript typy
├── tests/
│   └── unit/                         # Testy izolace, tokenů, e-mailů, idempotence
├── .env.example                      # Šablona proměnných prostředí
└── README.md
```

---

## 🚀 Rychlý start pro lokální vývoj

### 1. Klonování a instalace závislostí

```bash
git clone https://github.com/petrzahr/UklidSiTo.git
cd UklidSiTo
npm install
```

### 2. Nastavení proměnných prostředí

Zkopírujte šablonu:
```bash
cp .env.example .env.local
```

Vyplňte `.env.local`:
- `APP_ENV=development`
- `ADMIN_EMAIL=vas-email@gmail.com`
- `GOOGLE_SHEET_ID_TEST=id-vasi-testovaci-google-tabulky`
- `TEST_EMAIL_RECIPIENT=vas-testovaci-inbox@gmail.com`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=vas-google-client-id.apps.googleusercontent.com`
- `SESSION_SECRET=vase-nahodne-tajne-heslo-min-32-znaku`

*(Poznámka: Pokud ještě nemáte vytvořený Google Service Account, aplikace v development režimu automaticky použije in-memory úložiště, takže můžete UI a toky okamžitě testovat.)*

### 3. Spuštění testů

```bash
npm test
```

### 4. Spuštění vývojového serveru

```bash
npm run dev
```

Aplikace poběží na `http://localhost:3000`.

---

## ⚙️ Nastavení externích služeb

### 1. Google Cloud Console (Google Identity Services & Service Account)

1. V [Google Cloud Console](https://console.cloud.google.com/) vytvořte projekt (např. `UklidSiTo`).
2. Povolte rozhraní API:
   - **Google Sheets API**
   - **Google Drive API**
3. **OAuth 2.0 Client ID (pro administrátora přes Google Identity Services)**:
   - Vytvořte přihlašovací údaje OAuth Client ID (Web Application).
   - Do **Authorized JavaScript origins** přidejte:
     - Lokálně: `http://localhost:3000`
     - Produkce: `https://uklidsito.byzahr.app`
   - *Poznámka:* Redirect URIs ani Client Secret nejsou potřeba! Google Identity Services vrací ID token přímo do frontendu.
   - Zkopírujte `Client ID` do `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
4. **Service Account (pro zápis do Google tabulek)**:
   - Vytvořte Service Account (např. `uklidsito-service@...`).
   - Vygenerujte nový klíč typu **JSON**.
   - E-mail service accountu zadejte do `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
   - Privátní klíč z JSONu vložte do `GOOGLE_PRIVATE_KEY` (včetně `\n` nebo reálných nových řádků).

---

### 2. Google Sheets (PROD vs TEST)

1. Vytvořte v Google Drive **dvě samostatné tabulky**:
   - `UklidSiTo - PRODUCTION`
   - `UklidSiTo - TEST`
2. Obě tabulky **nasdílejte e-mailu Service Accountu** jako **Editor** (`Editor / Úpravce`).
3. Zkopírujte ID tabulek z URL adresy do proměnných:
   - `GOOGLE_SHEET_ID_PROD`
   - `GOOGLE_SHEET_ID_TEST`
4. Po spuštění aplikace otevřete `Nastavení → Systém` a klikněte na **"Inicializovat tabulku"**. Aplikace automaticky a bezpečně (idempotentně) vytvoří potřebné záložky (`Tasks`, `People`, `TaskPresets`, `Rooms`, `ActivityLog`), záhlaví sloupců i výchozí předvolby úkolů a členů (Eva, Anna).

---

### 3. Resend (E-mailová služba)

1. Vytvořte si účet na [Resend.com](https://resend.com/).
2. Vygenerujte API klíč v sekci **API Keys** a uložte jej do `RESEND_API_KEY`.
3. Pro produkci ověřte doménu `uklidsito.byzahr.app` a nastavte `EMAIL_FROM=UklidSiTo <uklid@uklidsito.byzahr.app>`. Pro testování lze použít `onboarding@resend.dev`.

---

## 🔒 Přehled proměnných prostředí podle prostředí

| Proměnná | Lokální vývoj (`.env.local`) | Vercel Preview | Vercel Production |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | `development` | `preview` | `production` |
| `APP_BASE_URL` | `http://localhost:3000` | `https://${VERCEL_URL}` | `https://uklidsito.byzahr.app` |
| `ADMIN_EMAIL` | Váš Google e-mail | Váš Google e-mail | Váš Google e-mail |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth Client ID | OAuth Client ID | OAuth Client ID |
| `SESSION_SECRET` | Bezpečný náhodný řetězec (32+ znaků) | Bezpečný náhodný řetězec | Bezpečný náhodný řetězec |
| `GOOGLE_SHEET_ID_PROD` | *(nevyplňovat nebo testovací)* | *(nevyplňovat)* | **ID produkční tabulky** |
| `GOOGLE_SHEET_ID_TEST` | **ID testovací tabulky** | **ID testovací tabulky** | *(nevyplňovat)* |
| `TEST_EMAIL_RECIPIENT` | Váš testovací inbox | Váš testovací inbox | *(nevyplňovat)* |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`| E-mail service accountu | E-mail service accountu | E-mail service accountu |
| `GOOGLE_PRIVATE_KEY` | Privátní klíč | Privátní klíč | Privátní klíč |
| `RESEND_API_KEY` | Resend API klíč | Resend API klíč | Resend API klíč |
| `EMAIL_FROM` | `onboarding@resend.dev` | `onboarding@resend.dev` | `UklidSiTo <uklid@uklidsito.byzahr.app>` |

---

## 🧪 Bezpečný testovací postup v TEST před spuštěním PROD

Před přepnutím do produkce proveďte tento testovací scénář:

1. **Ověření prostředí**:
   - V horní liště aplikace musí svítit žlutý badge `DEV (TEST DATA)` nebo `PREVIEW / TEST`.
   - V `Nastavení → Systém` ověřte, že aktivní tabulka odpovídá `GOOGLE_SHEET_ID_TEST`.
2. **Přihlášení administrátora**:
   - Přihlaste se přes Google účet shodný s `ADMIN_EMAIL`. Přihlášení musí projít.
   - Zkuste se přihlásit jakýmkoliv jiným Google účtem. Přihlášení musí být okamžitě zamítnuto chybou "Přístup odepřen".
3. **Zadání úkolu**:
   - Klikněte na `+ NAHLÁSIT BORDEL`.
   - Zvolte úkol `🍽️ Vyklidit myčku`, vyberte `Eva`, přidejte poznámku a klikněte na `ZADAT ÚKOL`.
   - Zobrazí se `✅ Pachatel byl informován.`
4. **Ověření e-mailu**:
   - Zkontrolujte schránku zadanou v `TEST_EMAIL_RECIPIENT`.
   - E-mail musí obsahovat varovný banner: `⚠️ TEST EMAIL - Původní příjemce: Eva <eva@example.com>`. Reálná Eva žádný e-mail neobdrží.
5. **Ověření bezpečnosti odkazu (Read-Only GET)**:
   - Zkopírujte odkaz z e-mailu a otevřete jej v prohlížeči.
   - Stránka se zobrazí, ale úkol na dashboardu **musí zůstat v záložce "Aktivní"**.
6. **Potvrzení splnění**:
   - Na stránce úkolu klikněte na velké zelené tlačítko `MÁM HOTOVO`.
   - Zobrazí se hravé potvrzení (např. `✅ Uklizeno!`).
   - Na dashboardu se úkol přesune do záložky `Hotovo`.
7. **Idempotence**:
   - Znovu obnovte odkaz v prohlížeči. Zobrazí se informace: `✅ Tento úkol už je splněný.` Původní čas splnění zůstane nezměněn.
8. **Zrušení a rotace**:
   - Zkuste vytvořit nový úkol a následně v editaci změnit řešitele z Evy na Annu. Ověřte, že starý odkaz přestane fungovat a vygeneruje se nový.

---

## 📜 Licence

Soukromá rodinná aplikace. Všechna práva vyhrazena.
