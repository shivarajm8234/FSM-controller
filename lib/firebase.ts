import { initializeApp, getApps, getApp } from "firebase/app"
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyDzLGavXSYRvhxjNlxnMbNR7mqj8OaDo9o",
  authDomain: "fsm-controller.firebaseapp.com",
  projectId: "fsm-controller",
  storageBucket: "fsm-controller.firebasestorage.app",
  messagingSenderId: "238027382980",
  appId: "1:238027382980:web:5520d813b99a4672f72991",
  measurementId: "G-ZN31E7M68G"
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Initialize Analytics (client-side only)
let analytics = null
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  })
}

export { app, analytics }
