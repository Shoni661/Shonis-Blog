const postsContainer = document.getElementById("postsContainer");
const categoriesContainer = document.getElementById("categories");
const searchInput = document.getElementById("searchInput");

let posts = [];
let categories = [];

let selectedCategory = "all";


// ============================================================
// CARGAR DATOS
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

        console.error("Error:", error);

        postsContainer.innerHTML = `
            <div class="empty">
                No se pudieron cargar las publicaciones.
            </div>
        `;
    }
}


// ============================================================
// CATEGORÍAS
// ============================================================

function renderCategories() {

    categoriesContainer.innerHTML = "";

    categories.forEach(category => {

        const button = document.createElement("button");

        button.className = "category-btn";

        button.textContent = category.name;

        button.dataset.category = category.id;

        button.addEventListener("click", () => {

            selectedCategory = String(category.id);

            updateActiveCategory();

            renderPosts();

        });

        categoriesContainer.appendChild(button);

    });

}


// ============================================================
// BOTÓN "TODOS"
// ============================================================

const allButton = document.querySelector(
    '.category-btn[data-category="all"]'
);

if (allButton) {

    allButton.addEventListener("click", () => {

        selectedCategory = "all";

        updateActiveCategory();

        renderPosts();

    });

}


// ============================================================
// CATEGORÍA ACTIVA
// ============================================================

function updateActiveCategory() {

    document
        .querySelectorAll(".category-btn")
        .forEach(button => {

            button.classList.remove("active");

            if (
                button.dataset.category === selectedCategory
            ) {

                button.classList.add("active");

            }

        });

}


// ============================================================
// MOSTRAR PUBLICACIONES
// ============================================================

function renderPosts() {

    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";


    let filteredPosts = posts.filter(post => {

        const matchesCategory =
            selectedCategory === "all" ||
            String(post.categoryId) === selectedCategory;


        const matchesSearch =
            !search ||
            post.title.toLowerCase().includes(search) ||
            post.content.toLowerCase().includes(search);


        return matchesCategory && matchesSearch;

    });


    postsContainer.innerHTML = "";


    if (filteredPosts.length === 0) {

        postsContainer.innerHTML = `
            <div class="empty">
                No hay publicaciones para mostrar.
            </div>
        `;

        return;
    }


    filteredPosts.forEach(post => {

        const category = categories.find(
            category =>
                Number(category.id) === Number(post.categoryId)
        );


        const categoryName = category
            ? category.name
            : "Sin categoría";


        const article = document.createElement("article");

        article.className = "post";


        let imageHTML = "";

        if (post.image) {

            imageHTML = `
                <img
                    class="post-image"
                    src="${escapeHTML(post.image)}"
                    alt="${escapeHTML(post.title)}"
                    onerror="this.style.display='none'"
                >
            `;

        }


        article.innerHTML = `

            ${imageHTML}

            <div class="post-body">

                <div class="post-category">
                    ${escapeHTML(categoryName)}
                </div>

                <h2 class="post-title">
                    ${escapeHTML(post.title)}
                </h2>

                <div class="post-date">
                    ${formatDate(post.createdAt)}
                </div>

                <div class="post-content">
                    ${escapeHTML(post.content)}
                </div>

            </div>

        `;


        postsContainer.appendChild(article);

    });

}


// ============================================================
// BUSCADOR
// ============================================================

if (searchInput) {

    searchInput.addEventListener("input", () => {

        renderPosts();

    });

}


// ============================================================
// FECHA
// ============================================================

function formatDate(date) {

    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
        return "";
    }

    return d.toLocaleDateString("es-AR", {

        day: "numeric",

        month: "long",

        year: "numeric"

    });

}


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
// INICIAR
// ============================================================

loadData();