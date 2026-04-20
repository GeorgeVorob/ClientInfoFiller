# CostumeCRM — гайд по запуску с нуля

## Требования к окружению

| Инструмент | Минимальная версия | Команда проверки |
|---|---|---|
| Node.js | 18.x | `node -v` |
| npm | 9.x | `npm -v` |
| Electron (ставится через npm) | 31.x | — |

Рекомендуется Node.js **20 LTS** или **22 LTS**.  
Скачать: https://nodejs.org

---

## Шаг 1 — Проверить Node.js и npm

```bash
node -v
# ожидаем: v20.x.x или v22.x.x

npm -v
# ожидаем: 9.x или 10.x
```

Если `node` не найден — поставить через пакетный менеджер или nvm:

```bash
# через nvm (рекомендуется, чтобы иметь несколько версий)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# перезапустить терминал, затем:
nvm install 20
nvm use 20
```

---

## Шаг 2 — Получить код

### Вариант A: scaffold-скрипт (генерирует все файлы на месте)

```bash
# Скачайте scaffold.sh рядом с которым хотите создать папку проекта
bash scaffold.sh
cd costume-crm
```

### Вариант B: вручную распаковать архив

```bash
unzip costume-crm.zip
cd costume-crm
```

---

## Шаг 3 — Установить зависимости

```bash
npm install
```

Что установится:
- `electron` — рантайм
- `electron-vite` — сборщик (Vite под капотом, умеет main/preload/renderer)
- `exceljs` — чтение/запись .xlsx
- `docxtemplater` + `pizzip` — заполнение Word-шаблона
- `react` + `react-dom` — UI

> **Первый `npm install` может занять 1–3 минуты** — electron скачивает бинарник (~100 МБ).  
> Если он завис — проверьте VPN / прокси:
> ```bash
> npm install --verbose
> ```

---

## Шаг 4 — Подготовить Word-шаблон

Положите файл `wordTemplate.docx` в папку `assets/`:

```
costume-crm/
└── assets/
    └── wordTemplate.docx   ← сюда
```

**Важно:** шаблон должен содержать плейсхолдеры в фигурных скобках вместо закладок из оригинального C# приложения:

| Старая закладка (C#) | Новый плейсхолдер |
|---|---|
| `ID` | `{ID}` |
| `CustomerName` | `{CustomerName}` |
| `CostumeName` | `{CostumeName}` |
| `Phone` | `{Phone}` |
| `CreationDate` | `{CreationDate}` |
| `ActualOrderDate` | `{ActualOrderDate}` |
| `ReturnDate` | `{ReturnDate}` |
| `Price` | `{Price}` |
| `Prepayment` | `{Prepayment}` |
| `Owe` | `{Owe}` |
| `Pledge` | `{Pledge}` |
| `Comment` | `{Comment}` |
| `PrintDateTime` | `{PrintDateTime}` |

Просто откройте старый docx, найдите места где были закладки, и напишите `{ИмяЗакладки}` обычным текстом. Сохраните.

---

## Шаг 5 — Запустить в режиме разработки

```bash
npm run dev
```

Откроется окно приложения + DevTools в отдельном окне (для отладки).

---

## Шаг 6 — Собрать .exe для Windows

```bash
npm run package
```

Готовый установщик появится в папке `release/`.

> Сборка под Windows на Linux/Mac требует Wine или запускается прямо на Windows.

---

## Типичные проблемы

### `Cannot find module 'electron-vite'`
```bash
npm install  # зависимости не установлены
```

### `Error: Cannot find module '@shared/types'`
Это алиас из `tsconfig`. Если IDE ругается — перезапустить TypeScript Language Server (`Ctrl+Shift+P → Restart TS Server` в VS Code).

### Electron не запускается, ошибка про `SUID sandbox`
Только на Linux:
```bash
npm run dev -- --no-sandbox
# или один раз:
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
```

### `exceljs` не может открыть файл
Убедитесь что файл Excel не открыт в другой программе одновременно.

### Word-документ не открывается
- Убедитесь что `assets/wordTemplate.docx` существует.
- На Linux нужен LibreOffice: `sudo apt install libreoffice`.
- На Windows должен быть Word или любой другой обработчик .docx по умолчанию.

---

## Конфиг приложения

Пути к Excel-файлам сохраняются автоматически между запусками.  
Файл конфига лежит здесь:

| ОС | Путь |
|---|---|
| Windows | `%APPDATA%\costume-crm\config.json` |
| Linux | `~/.config/costume-crm/config.json` |
| macOS | `~/Library/Application Support/costume-crm/config.json` |

Удалить его — сбросить настройки.
