<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input id="email" v-model="email" type="email" required >
      </div>
      <div class="form-group">
        <label for="password">Senha:</label>
        <input id="password" v-model="password" type="password" required >
      </div>
      <button type="submit" :disabled="loading">Entrar</button>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import AuthService from "~/app/services/AuthService";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const error = ref(null);
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  error.value = null;
  loading.value = true;
  try {
    await AuthService.login(email.value, password.value);
    router.push("/dashboard");
  } catch (err) {
    error.value = err.message || "Falha no login";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input[type="email"], input[type="password"] {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.error-msg {
  color: red;
  margin-top: 0.5rem;
}
</style>
