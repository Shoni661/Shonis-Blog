const adminPosts = document.getElementById("adminPosts");
const adminCategories = document.getElementById("adminCategories");

const newCategory = document.getElementById("newCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");

const newPostBtn = document.getElementById("newPostBtn");

const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const postForm = document.getElementById("postForm");

const modalTitle = document.getElementById("modalTitle");

const postTitle = document.getElementById("postTitle");
const postCategory = document.getElementById("postCategory");
const postImage = document.getElementById("postImage");
const postContent = document.getElementById("postContent");

const logoutBtn = document.getElementById("logoutBtn");

let categories = [];
let posts = [];

let editingPostId = null;


// ============================================================
// COMPROBAR SESIÓN
// ============================================================

async function checkSession() {

    try {

        const response = await fetch("/api/session");

        const data = await response.json();

        if (!data.loggedIn) {
            window.location.href = "/login.html";
            return false;
        }

        return true;

    } catch (error) {

        console.error("Error comprobando sesión:", error);

        window.location.href = "/login.html";

        return false;
    }
}


// ============================================================
// CARGAR TODO
// ============================================================

async function loadData() {

    try {

        const [categoriesResponse, postsResponse] = await Promise.all([
            fetch("/api/categories"),
            fetch("/api/posts")
        ]);

        if (!categoriesResponse.ok || !postsResponse.ok) {
            throw new Error("No se pudieron cargar los datos.");
        }

        categories = await categoriesResponse.json();
        posts = await postsResponse.json();

        renderCategories();
        renderPosts();

    } catch (error) {

        console.error(error);

        adminPosts.innerHTML = `
            <p style="color:#ff5577">
                Error cargando las publicaciones.
            </p>
        `;

        adminCategories.innerHTML = `
            <p style="color:#ff5577">
                Error cargando las categorías.
            </p>
        `;
    }
}


// ============================================================
// CATEGORÍAS
// ============================================================

function renderCategories() {

    adminCategories.innerHTML = "";

    if (categories.length === 0) {

        adminCategories.innerHTML = `
            <p class="loading">
                No hay categorías todavía.
            </p>
        `;

        return;
    }

    categories.forEach(category => {

        const element = document.createElement("div");

        element.className = "admin-category";

        element.innerHTML = `
            <span>${escapeHTML(category.name)}</span>

            <button
                class="category-delete"
                data-id="${category.id}"
                title="Eliminar categoría"
            >
                ×
            </button>
        `;

        adminCategories.appendChild(element);

    });

    document
        .querySelectorAll(".category-delete")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const id = Number(button.dataset.id);

                await deleteCategory(id);

            });

        });
}


// ============================================================
// CREAR CATEGORÍA
// ============================================================

addCategoryBtn.addEventListener("click", createCategory);

newCategory.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        event.preventDefault();
        createCategory();
    }

});


async function createCategory() {

    const name = newCategory.value.trim();

    if (!name) {

        alert("Escribí un nombre para la categoría.");

        return;
    }

    addCategoryBtn.disabled = true;

    try {

        const response = await fetch("/api/categories", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name
            })

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "No se pudo crear la categoría."
            );

        }

        newCategory.value = "";

        await loadData();

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        addCategoryBtn.disabled = false;

    }
}


// ============================================================
// ELIMINAR CATEGORÍA
// ============================================================

async function deleteCategory(id) {

    const category = categories.find(
        category => category.id === id
    );

    if (!category) return;

    const confirmed = confirm(
        `¿Eliminar la categoría "${category.name}"?`
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `/api/categories/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "No se pudo eliminar."
            );

        }

        await loadData();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }
}


// ============================================================
// PUBLICACIONES
// ============================================================

function renderPosts() {

    adminPosts.innerHTML = "";

    if (posts.length === 0) {

        adminPosts.innerHTML = `
            <div class="empty">
                Todavía no tenés publicaciones.
            </div>
        `;

        return;
    }

    posts.forEach(post => {

        const category = categories.find(
            category => category.id === post.categoryId
        );

        const categoryName = category
            ? category.name
            : "Sin categoría";

        const element = document.createElement("div");

        element.className = "admin-post";

        element.innerHTML = `

            <div class="admin-post-info">

                <div class="admin-post-title">
                    ${escapeHTML(post.title)}
                </div>

                <div class="admin-post-date">
                    ${escapeHTML(categoryName)}
                </div>

            </div>

            <div class="admin-post-actions">

                <button
                    class="edit-btn"
                    data-id="${post.id}"
                >
                    Editar
                </button>

                <button
                    class="delete-btn"
                    data-id="${post.id}"
                >
                    Eliminar
                </button>

            </div>
        `;

        adminPosts.appendChild(element);

    });


    document
        .querySelectorAll(".edit-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const id = Number(button.dataset.id);

                editPost(id);

            });

        });


    document
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const id = Number(button.dataset.id);

                deletePost(id);

            });

        });
}


// ============================================================
// ABRIR NUEVA PUBLICACIÓN
// ============================================================

newPostBtn.addEventListener("click", () => {

    editingPostId = null;

    modalTitle.textContent = "Nueva publicación";

    postForm.reset();

    loadCategorySelect();

    modal.classList.add("active");

});


// ============================================================
// CARGAR CATEGORÍAS EN SELECT
// ============================================================

function loadCategorySelect(selectedId = null) {

    postCategory.innerHTML = "";

    if (categories.length === 0) {

        const option = document.createElement("option");

        option.value = "";

        option.textContent = "Primero creá una categoría";

        postCategory.appendChild(option);

        return;
    }

    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category.id;

        option.textContent = category.name;

        if (selectedId !== null &&
            Number(selectedId) === Number(category.id)) {

            option.selected = true;

        }

        postCategory.appendChild(option);

    });
}


// ============================================================
// EDITAR PUBLICACIÓN
// ============================================================

function editPost(id) {

    const post = posts.find(
        post => post.id === id
    );

    if (!post) return;

    editingPostId = id;

    modalTitle.textContent = "Editar publicación";

    postTitle.value = post.title || "";

    postImage.value = post.image || "";

    postContent.value = post.content || "";

    loadCategorySelect(post.categoryId);

    modal.classList.add("active");

}


// ============================================================
// GUARDAR PUBLICACIÓN
// ============================================================

postForm.addEventListener("submit", async event => {

    event.preventDefault();

    const title = postTitle.value.trim();

    const content = postContent.value.trim();

    const image = postImage.value.trim();

    const categoryId = Number(postCategory.value);


    if (!title) {

        alert("Escribí un título.");

        return;
    }


    if (!content) {

        alert("Escribí contenido.");

        return;
    }


    if (!categoryId) {

        alert("Elegí una categoría.");

        return;
    }


    const postData = {

        title: title,

        content: content,

        image: image,

        categoryId: categoryId

    };


    try {

        let response;


        if (editingPostId === null) {

            response = await fetch("/api/posts", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(postData)

            });

        } else {

            response = await fetch(
                `/api/posts/${editingPostId}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(postData)

                }
            );

        }


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "No se pudo guardar."
            );

        }


        closeModal();

        await loadData();


    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});


// ============================================================
// ELIMINAR PUBLICACIÓN
// ============================================================

async function deletePost(id) {

    const post = posts.find(
        post => post.id === id
    );

    if (!post) return;


    const confirmed = confirm(
        `¿Eliminar "${post.title}"?`
    );


    if (!confirmed) return;


    try {

        const response = await fetch(
            `/api/posts/${id}`,
            {
                method: "DELETE"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "No se pudo eliminar."
            );

        }


        await loadData();


    } catch (error) {

        console.error(error);

        alert(error.message);

    }
}


// ============================================================
// MODAL
// ============================================================

function closeModal() {

    modal.classList.remove("active");

    editingPostId = null;

    postForm.reset();

}


closeModalBtn.addEventListener(
    "click",
    closeModal
);


cancelBtn.addEventListener(
    "click",
    closeModal
);


modal.addEventListener("click", event => {

    if (event.target === modal) {

        closeModal();

    }

});


// ============================================================
// LOGOUT
// ============================================================

logoutBtn.addEventListener("click", async () => {

    try {

        await fetch("/api/logout", {
            method: "POST"
        });

    } finally {

        window.location.href = "/login.html";

    }

});


// ============================================================
// SEGURIDAD HTML
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// INICIO
// ============================================================

(async () => {

    const loggedIn = await checkSession();

    if (!loggedIn) return;

    await loadData();

})();