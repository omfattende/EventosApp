# Guía de Deploy

## 1. Deploy del Backend (Render.com - GRATIS)

### 1.1 Crear base de datos PostgreSQL
1. Andá a https://dashboard.render.com/
2. Creá un **PostgreSQL** nuevo (gratis)
3. Copiá la **Internal Database URL** o **External Database URL**

### 1.2 Crear Web Service para el backend
1. En Render, creá un nuevo **Web Service**
2. Conectá tu repo de GitHub o subí el código manualmente
3. Configurá:
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend`
4. Agregá las **Environment Variables**:
   ```
   DATABASE_URL=postgres://... (la URL de tu DB de Render)
   JWT_SECRET=tu_clave_secreta_larga_y_segura
   CORS_ORIGINS=https://TU-SITIO.netlify.app,https://TU-DOMINIO.com
   ```
5. Deployá y copiá la URL del backend (ej: `https://eventos-api.onrender.com`)

## 2. Configurar el Frontend para Producción

1. Abrí `frontend/src/environments/environment.prod.ts`
2. Reemplazá las URLs con las de tu backend:
   ```ts
   export const environment = {
     production: true,
     apiUrl: 'https://TU-BACKEND-URL.onrender.com/api',
     socketUrl: 'https://TU-BACKEND-URL.onrender.com',
   };
   ```

## 3. Deploy del Frontend (Netlify)

Ya tenés Netlify configurado. Tenés dos opciones:

### Opción A: Netlify CLI (más rápido)
```bash
cd frontend
npm run build
npx netlify deploy --prod --dir=dist/frontend/browser
```

### Opción B: Git + Deploy automático
1. Subí todo a GitHub
2. En Netlify, conectá el repo
3. Configurá:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/frontend/browser`
4. Netlify hará deploy automático en cada push

## 4. Verificar

- Frontend: https://TU-SITIO.netlify.app
- Backend: https://TU-BACKEND-URL.onrender.com/health

## Notas importantes

- **Las imágenes subidas** se guardan en el servidor. En Render (gratis), el disco se reinicia al dormir, así que las imágenes pueden desaparecer. Para producción real, usá **Cloudinary** o **AWS S3**.
- **Socket.io** usa la misma URL del backend. Asegurate de que funcione con HTTPS.
- El plan gratuito de Render se "duerme" después de 15 min de inactividad. El primer request puede tardar ~30 segundos en despertarlo.
