### Get Started locally

# frontend:
```
cd exploding-kittens-frontend

npm i

//add to .env.local

// will be the port you run the backend on and should be 3000 unless it's occupied
NEXT_PUBLIC_BACKEND_API="http://localhost:3000/"
// for authetication and other visible state varibles
NEXT_PUBLIC_DEV_MODE=[boolean value]

//to start nextjs client
npm run dev
```

# backend
```
cd backend

npm i

//add to .env

DB_URI=[mongo compass access url]
JWT_SECRET=[any string]

//to start server
nodemon
```
