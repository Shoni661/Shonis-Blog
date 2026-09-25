const form = document.getElementById("loginForm");
const error = document.getElementById("loginError");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    console.log("USUARIO ENVIADO:", username);
    console.log("CONTRASEÑA ENVIADA:", password);

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        console.log("RESPUESTA DEL SERVIDOR:", data);

        if (response.ok && data.success) {
            window.location.href = "/admin.html";
        } else {
            error.textContent = data.error || "Error al iniciar sesión.";
        }

    } catch (error) {
        console.error("ERROR:", error);
        error.textContent = "No se pudo conectar con el servidor.";
    }
});