# معماری سیستم | Architecture

> این سند معماری هدف (target architecture) رخشا را توصیف می‌کند. در MVP فقط لایه‌های ۱ تا ۳ و بخشی از ۵ ساخته می‌شوند؛ لایه‌ی ۴ (AI/ML) از فاز ۲ به بعد اضافه می‌شود. جزئیات فازبندی در [ROADMAP.md](./ROADMAP.md).

## نمای کلی جریان داده

```
[رکتیفایر/شارژر/باتری]
        │  (Modbus RTU/TCP, SNMP, پروتکل اختصاصی برند)
        ▼
[Edge Gateway محلی در سایت]
        │  (بافر محلی برای قطعی شبکه، MQTT over TLS)
        ▼
[Ingestion API / MQTT Broker]  →  [Raw Data Lake]
        │
        ▼
[ETL / Stream Processing]  →  [Time-Series DB]
        │
        ▼
[لایه AI/ML: Anomaly Detection · RUL Estimation · Failure Prediction]
        │
        ▼
[API Backend]  →  [Dashboard (وب)] + [هشدار: SMS/Telegram/Email] + [اتصال CMMS]
```

## لایه‌ها

### ۱. لایه‌ی میدانی (Edge / Field Layer)
- اتصال به رکتیفایر/شارژر/BMS باتری از طریق **Modbus RTU/TCP** یا **SNMP** (رایج‌ترین پروتکل‌های برندهای مخابراتی/صنعتی ایران).
- پارامترهای اصلی: ولتاژ باس DC، جریان بار، جریان شارژ باتری، دمای محیط/سلول، وضعیت آلارم‌های سخت‌افزاری، مقاومت داخلی باتری (در صورت پشتیبانی BMS).
- برای سایت‌هایی که پروتکل استاندارد ندارند: آداپتور اختصاصی per-brand.

### ۲. لایه‌ی اتصال (Connectivity Layer)
- **Edge Gateway** محلی (Raspberry Pi class یا صنعتی) با بافر محلی — چون بسیاری از سایت‌های مخابراتی/دورافتاده اتصال اینترنت ناپایدار دارند.
- انتقال با **MQTT over TLS** به سمت ابر؛ در صورت قطعی، داده محلی صف می‌شود و بعد از اتصال مجدد sync می‌شود.
- برای سایت‌های حساس (نفت و گاز، نظامی) گزینه‌ی **on-prem / air-gapped deployment**.

### ۳. لایه‌ی پلتفرم داده (Data Platform Layer)
- **Time-Series DB** (TimescaleDB یا InfluxDB) برای متریک‌های پرفرکانس.
- **Data Lake** برای داده خام (اثبات‌پذیری، بازآموزش مدل در آینده).
- ETL برای نرمال‌سازی داده‌ی برندهای مختلف رکتیفایر به یک schema واحد.

### ۴. لایه‌ی هوش مصنوعی (AI/ML Layer) — از فاز ۲
- **Anomaly Detection**: در نبود داده‌ی خرابی برچسب‌خورده کافی، شروع با روش‌های unsupervised (Isolation Forest, Autoencoder) روی سری‌های زمانی ولتاژ/جریان/دما.
- **Battery Health Scoring / SoH**: تخمین State-of-Health بانک باتری از روی روند مقاومت داخلی و منحنی شارژ/دشارژ.
- **RUL Estimation**: تخمین عمر باقی‌مانده بر پایه‌ی روند افت پارامترها (survival analysis / regression).
- **Failure Prediction**: طبقه‌بندی ریسک خرابی نزدیک، با بازخورد از تیکت‌های نگهداری واقعی (label شدن تدریجی با feedback loop).
- Model Registry + pipeline بازآموزش دوره‌ای با داده‌ی تازه.

### ۵. لایه‌ی اپلیکیشن (Application Layer)
- **API Backend** (REST/GraphQL) برای dashboard و یکپارچه‌سازی.
- **Rules & Alerting Engine**: آستانه‌های ساده (فاز ۱) + هشدار مبتنی‌بر مدل (فاز ۲ به بعد).
- **Dashboard وب**: نمای زنده‌ی سایت‌ها، روند تاریخی، وضعیت سلامت هر تجهیز، RUL.
- کانال‌های هشدار: SMS، Telegram Bot، ایمیل — متناسب با کارشناسان فنی ایران.
- یکپارچه‌سازی با CMMS/تیکتینگ نگهداری (فاز ۳).

### امنیت و انطباق
- چون تجهیزات در زیرساخت حیاتی هستند: segmentation شبکه، رمزنگاری end-to-end، audit log کامل، گزینه‌ی on-prem برای سایت‌های طبقه‌بندی‌شده.
- سطح دسترسی نقش‌محور (RBAC) برای اپراتور/کارشناس نگهداری/مدیر.

## تصمیم‌های فنی باز (نیازمند تحقیق)
- انتخاب نهایی Time-Series DB (TimescaleDB vs InfluxDB vs QuestDB).
- پروتکل غالب در بازار ایران برای رکتیفایرهای مخابراتی رایج (بررسی برندهای متداول).
- معماری چندمستأجری (multi-tenant) برای فاز SaaS در برابر deployment اختصاصی per-client.
