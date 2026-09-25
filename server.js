require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = 3000;

// ============================================================
// CONFIGURACIÓN
// ============================================================

const ADMIN_USER = "mateo";
const ADMIN_PASSWORD = "1234";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltan SUPABASE_URL o SUPABASE_KEY en .env");
    process.exit(1);
}

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());

app.use(
    session({
        secret: "mi_clave_secreta_blog_938472",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// FUNCIONES
// ============================================================

function isAdmin(req) {
    return req.session && req.session.admin === true;
}

// ============================================================
// LOGIN
// ============================================================

app.post("/api/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log("Intento de login:", username);

    if (
        username === ADMIN_USER &&
        password === ADMIN_PASSWORD
    ) {
        req.session.admin = true;

        return res.json({
            success: true
        });
    }

    return res.status(401).json({
        success: false,
        error: "Usuario o contraseña incorrectos"
    });
});

// ============================================================
// SESIÓN
// ============================================================

app.get("/api/session", (req, res) => {
    res.json({
        loggedIn: isAdmin(req)
    });
});

// ============================================================
// LOGOUT
// ============================================================

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({
            success: true
        });
    });
});

// ============================================================
// CATEGORÍAS
// ============================================================

// Obtener categorías
app.get("/api/categories", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("id", {
                ascending: true
            });

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "Error obteniendo categorías"
            });
        }

        res.json(data);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error del servidor"
        });
    }
});

// Crear categoría
app.post("/api/categories", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(401).json({
            error: "No autorizado"
        });
    }

    try {
        const name = String(
            req.body.name || ""
        ).trim();

        if (!name) {
            return res.status(400).json({
                error: "Nombre inválido"
            });
        }

        const { data, error } = await supabase
            .from("categories")
            .insert({
                name: name
            })
            .select()
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "No se pudo crear la categoría"
            });
        }

        res.json(data);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error del servidor"
        });
    }
});

// Eliminar categoría
app.delete("/api/categories/:id", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(401).json({
            error: "No autorizado"
        });
    }

    try {
        const id = Number(req.params.id);

        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "No se pudo eliminar la categoría"
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error del servidor"
        });
    }
});

// ============================================================
// PUBLICACIONES
// ============================================================

// Obtener publicaciones
app.get("/api/posts", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "Error obteniendo publicaciones"
            });
        }

        const posts = data.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            image: post.image || "",
            categoryId: post.category_id,
            createdAt: post.created_at
        }));

        res.json(posts);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error del servidor"
        });
    }
});

// Crear publicación
app.post("/api/posts", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(401).json({
            error: "No autorizado"
        });
    }

    try {
        const title = String(
            req.body.title || ""
        ).trim();

        const content = String(
            req.body.content || ""
        ).trim();

        const image = String(
            req.body.image || ""
        ).trim();

        const categoryId = Number(
            req.body.categoryId
        );

        if (!title || !content) {
            return res.status(400).json({
                error: "Título y contenido son obligatorios"
            });
        }

        const { data, error } = await supabase
            .from("posts")
            .insert({
                title: title,
                content: content,
                image: image,
                category_id: categoryId
            })
            .select()
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "No se pudo crear la publicación"
            });
        }

        res.json({
            id: data.id,
            title: data.title,
            content: data.content,
            image: data.image || "",
            categoryId: data.category_id,
            createdAt: data.created_at
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error del servidor"
        });
    }
});

// Editar publicación
app.put("/api/posts/:id", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(401).json({
            error: "No autorizado"
        });
    }

    try {
        const id = Number(req.params.id);

        const title = String(
            req.body.title || ""
        ).trim();

        const content = String(
            req.body.content || ""
        ).trim();

        const image = String(
            req.body.image || ""
        ).trim();

        const categoryId = Number(
            req.body.categoryId
        );

        if (!title || !content) {
            return res.status(400).json({
                error: "Título y contenido son obligatorios"
            });
        }

        const { data, error } = await supabase
            .from("posts")
            .update({
                title: title,
                content: content,
                image: image,
                category_id: categoryId
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "No se pudo editar la publicación"
            });
        }

        res.json({
            id: data.id,
            title: data.title,
            content: data.content,
            image: data.image || "",
            categoryId: data.category_id,
            createdAt: data.created_at
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error del servidor"
        });
    }
});

// Eliminar publicación
app.delete("/api/posts/:id", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(401).json({
            error: "No autorizado"
        });
    }

    try {
        const id = Number(req.params.id);

        const { error } = await supabase
            .from("posts")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "No se pudo eliminar la publicación"
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error del servidor"
        });
    }
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log("");
    console.log("=================================");
    console.log("       SHONIS BLOG");
    console.log("=================================");
    console.log("");
    console.log("Blog:  http://localhost:3000");
    console.log("Admin: http://localhost:3000/login.html");
    console.log("");
    console.log("Usuario:", ADMIN_USER);
    console.log("Contraseña:", ADMIN_PASSWORD);
    console.log("");
    console.log("🟢 Supabase conectado");
    console.log("");
});