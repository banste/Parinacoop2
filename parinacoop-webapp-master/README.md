# Sistema Cooperativa en Línea Parinacoop

![Badge en Desarollo](https://img.shields.io/badge/STATUS-EN%20DESAROLLO-green)

El sistema Cooperativa en Línea es una de las soluciones informáticas propuestas para Parinacoop, Cooperativa de Ahorro y Crédito de la región de Arica y Parinacota, Chile.

Esta solución se trata de una interfaz web donde los clientes de Parinacoop puedan ingresar para ofrecerles una manera más cómoda de poder contratar inversiones dentro de la cooperativa, como contratar depósitos a plazo por medio de transferencia electrónica sin tener que recurrir a realizar este proceso de forma presencial.


## 🔨 Funcionalidades del sistema
- `Autenticación de clientes`: Iniciar sesión como cliente (debe estar previamente registrado en el sistema)
- `Perfiles de clientes`: Ver su perfil de usuario, como también información de contacto y dirección particular del cliente
- `Depósitos a Plazo`: Contratar depósitos a plazo, con un monto específico y periodo de inversión, como también visualizar depósitos ya contratados


## ✅ Stack

- Angular
- TailwindCSS
- Angular Material



## 🛠️ Ejecutar de manera local
### Prerrequisitos

- NodeJS versión 20 o superior
- Gestor de paquetes PNPM preferiblemente
- Tener el ejecución el servidor web dedicado](https://github.com/Drazor153/parinacoop-webserver)

Clonar el repositorio y entrar a la carpeta del repositorio

```bash
  git clone https://github.com/Drazor153/parinacoop-webapp
  cd parinacoop-webapp
```

Instalar dependencias
- NPM
```bash
  npm install
```
- PNPM
```bash
  pnpm install
```

Iniciar aplicacion
- NPM:
```bash
  npm run dev
```
- PNPM:
```bash
  pnpm dev
```
### Utilizando el CLI de Angular

Instalar el CLI de Angular 18:
- NPM
```bash
  npm install -g @angular/cli@18
```
- PNPM
```bash
  pnpm add -g @angular/cli@18
```

Ejecutar proyecto
```bash
  ng serve
```
