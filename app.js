import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  deleteDoc ,
  updateDoc,
  query,
  where,
  deleteField,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIJQpp4dTbHnzMFzRRGJMQo02gnI-7S08",
  authDomain: "foodpanda-c2f21.firebaseapp.com",
  projectId: "foodpanda-c2f21",
  storageBucket: "foodpanda-c2f21.firebasestorage.app",
  messagingSenderId: "511799832992",
  appId: "1:511799832992:web:77dbf4f6f5af24fffc74c5",
  measurementId: "G-47DVXCRHVX",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  const path = location.pathname;

  if (user) {
    const uid = user.uid;
    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {
      const role = userDoc.data().role;

      // If on login page and user is already authenticated, redirect them to correct page
      if (path === "/login.html") {
        location.href = role === "admin" ? "admin.html" : "user.html";
      }

      // Protect admin/user pages
      if (path === "/admin.html" && role === "admin") {
        document.getElementById("loading").style.display = "none";
        document.getElementById("adminContent").style.display = "block";
      } else if (path === "/admin.html" && role !== "admin") {
        location.href = "login.html";
      }

    } else {
      if (path !== "/login.html") location.href = "login.html";
    }

  } else {
    // Not logged in: block access to protected pages
    if (
      path === "/admin.html" ||
      path === "/user.html" ||
      path === "/cart.html"
    ) {
      // Skip auto-redirect if user is intentionally logging out
      if (sessionStorage.getItem("loggingOut") === "true") {
        sessionStorage.removeItem("loggingOut"); // clear it after use
        return;
      }
      location.href = "login.html";
    }
  }
});

  

function submitForm() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    Swal.fire("Please fill out all fields.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      try {
        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: user.email,
          role: "user"
        });

        // Show a success message with the name
        Swal.fire("Signup successful!", `Welcome, ${name}!`, "success").then(() => {
          location.href = "user.html";
        });
      } catch (firestoreError) {
        console.error("Firestore write failed:", firestoreError);
        Swal.fire("Error", "Failed to save user data. Please try again.", "error");
      }
    })
    .catch((authError) => {
      console.error("Auth Error:", authError);
      if (authError.code === "auth/email-already-in-use") {
        Swal.fire("Email Already Registered", "Please log in instead.", "warning");
      } else {
        Swal.fire("Error", authError.message || "Invalid Credentials", "error");
      }
    });
}

window.submitForm=submitForm;

function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const role = document.getElementById("loginRole").value;

  if (!role) {
    Swal.fire("Please select a role.");
    return;
  }

  // Show loading spinner
  Swal.fire({
    title: "Logging in...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.role.toLowerCase() === role.toLowerCase()) {
          // Wait 800ms so user sees loading spinner, then redirect
          setTimeout(() => {
            Swal.close();
            location.href = role === "admin" ? "admin.html" : "user.html";
          }, 800);
        } else {
          Swal.close();
          Swal.fire("Access Denied", "Role mismatch", "error");
          signOut(auth);
        }
      } else {
        Swal.close();
        Swal.fire("No Role Found", "User role is not registered", "error");
        signOut(auth);
      }
    })
    .catch(() => {
      Swal.close();
      Swal.fire("Error", "Invalid credentials", "error");
    });
}

window.login = login;


function logoutUser() {
  // Temporarily disable the auth state redirect
  sessionStorage.setItem("loggingOut", "true");

  Swal.fire({
    title: "Signing out...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  signOut(auth)
    .then(() => {
      setTimeout(() => {
        Swal.close();
        // Manual redirect
        window.location.href = "login.html";
      }, 800);
    })
    .catch((error) => {
      console.error("Error signing out:", error);
      Swal.close();
      Swal.fire("Oops...", "Failed to sign out", "error");
    });
}

window.logoutUser = logoutUser;



async function addProduct() {
  getProductListDiv.innerHTML ="";
  const product_id = document.getElementById("productId").value;
  const product_name = document.getElementById("productName").value;
  const product_price = document.getElementById("productPrice").value;
  const product_des = document.getElementById("productDescription").value;
  const product_url = document.getElementById("productImage").value;

  try {
    const docRef = await addDoc(collection(db, "items"), {
      product_id: product_id,
      product_name: product_name,
      product_price: product_price,
      product_des: product_des,
      product_url: product_url,
    });
    Swal.fire({
      title: "Product Added Successfully!",
      text: `Your Order Id : ${docRef.id}`,
      icon: "success",
    });
    getProductList();
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}
window.addProduct = addProduct;

let getProductListDiv = document.getElementById("product-list");
async function getProductList() {
    getProductListDiv.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "items"));
  querySnapshot.forEach((doc) => {
    getProductListDiv.innerHTML += `
        <div class="card" style="width: 18rem;">
    <img src="${doc.data().product_url}" class="card-img-top" alt="Image" style="height: 200px; object-fit: cover;">
  <div class="card-body">
    <h5 class="card-title">${doc.data().product_name}</h5>
    <p class="card-text">${doc.data().product_des}</p>
    <h5 class="card-title">${doc.data().product_price}</h5>
    <button class="btn btn-info" onclick='openEditModal("${doc.id}", "${doc.data().product_name}", "${doc.data().product_price}", "${doc.data().product_des}", "${doc.data().product_url}")'>Edit</button>
    <button onclick='delItem("${doc.id}")' class="btn btn-danger">Delete</button>
  </div>
</div>
      `;
  });
}
if(getProductListDiv){
    getProductList();
}

async function delItem(params){
    getProductListDiv.innerHTML ="";
    const cityRef = doc(db, 'items', params);

// Remove the 'capital' field from the document
await deleteDoc(cityRef, {
    capital: deleteField() //msla ni age hta bhi dyn
});
getProductList();
}
window.delItem=delItem;

window.openEditModal = function (id, name, price,desc,url) {
    document.getElementById("editProductId").value = id;
    document.getElementById("editProductName").value = name;
    document.getElementById("editProductPrice").value = price;
    document.getElementById("editProductDescription").value = desc;
    document.getElementById("editProductImage").value = url;
    let editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
    editModal.show();
  };

  window.saveProductChanges = async function () {
    const id = document.getElementById("editProductId").value;
    const name = document.getElementById("editProductName").value;
    const price = document.getElementById("editProductPrice").value;
    const des = document.getElementById("editProductDescription").value;
    const url = document.getElementById("editProductImage").value;
  
    try {
      await updateDoc(doc(db, "items", id), {
        product_id: id,
        product_name: name,
        product_price: price,
        product_des: des,
        product_url: url
      });
      Swal.fire("Upated!", "Product updated successfully!", "success");
      getProductList();
      bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
    } catch (error) {
      Swal.fire("Error", "Failed to update product", "error");
      console.error("Error updating product:", error);
    }
  };
  

  let userDiv = document.getElementById('userDiv')
  async function userData() {
    const querySnapshot = await getDocs(collection(db, "items"));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      userDiv.innerHTML += `
        <div class="card product-card" style="width: 18rem;">
          <img src="${data.product_url}" class="card-img-top" alt="Image" style="height: 200px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${data.product_name}</h5>
            <p class="card-text">${data.product_des}</p>
            <h5 class="card-text">₹${data.product_price}</h5>
          </div>
          <button onclick='addtocart("${docSnap.id}", "${data.product_name}", "${data.product_price}", "${data.product_des}", "${data.product_url}")' class='btn btn-primary m-2'>Add to Cart</button>
        </div>
      `;
    });
  }
if(userDiv){ //only for user
  userData();
}

window.addtocart = async function (id, name, price, desc, url) {
  const cartRef = collection(db, "carts");
  const q = query(cartRef, where("id", "==", id));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    Swal.fire({
      title: "Already in Cart!",
      text: "This product is already in your cart.",
      icon: "warning"
    });
    return;
  }

  await addDoc(cartRef, {
    id,
    name,
    price: parseFloat(price),
    desc,
    url,
    quantity: 1
  });

  Swal.fire({
    title: "Added!",
    text: "Product added to cart successfully.",
    icon: "success"
  });

  loadCartBadge();
};

async function loadCartBadge() {
  const cartBadge = document.getElementById("cart-badge");
  if (!cartBadge) return;

  const querySnapshot = await getDocs(collection(db, "carts"));
  let totalItems = 0;
  querySnapshot.forEach(doc => {
    totalItems += doc.data().quantity || 1;
  });

  cartBadge.innerText = totalItems;
}

const showCart = document.getElementById('showCart');

if (showCart) {
  cartData();
}

async function cartData() {
  const querySnapshot = await getDocs(collection(db, "carts"));
  showCart.innerHTML = "";
  let grandTotal = 0;

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const docId = docSnap.id;
    const itemTotal = data.price * data.quantity;
    grandTotal += itemTotal;

    showCart.innerHTML += `
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <img src="${data.url}" class="card-img-top" style="height: 200px; object-fit: cover;" alt="${data.name}">
          <div class="card-body">
            <h5 class="card-title">${data.name}</h5>
            <p class="card-text">${data.desc}</p>
            <h6>Price: ₹${data.price} × ${data.quantity} = ₹<span id="total-${docId}">${itemTotal}</span></h6>
            <div class="quantity-controls d-flex justify-content-center mt-2">
              <button class="btn btn-danger" onclick="updateQuantity('${docId}', -1)">-</button>
              <span class="mx-3" id="qty-${docId}">${data.quantity}</span>
              <button class="btn btn-success" onclick="updateQuantity('${docId}', 1)">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  showCart.innerHTML += `
    <div class="col-12 text-end mt-4">
      <h4>Total: ₹<span id="grandTotal">${grandTotal}</span></h4>
      <button class="btn btn-primary mt-2" onclick="placeOrder()">Place Order</button>
    </div>
  `;
}

window.updateQuantity = async function (docId, change) {
  const ref = doc(db, "carts", docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;
  let qty = snap.data().quantity;

  qty += change;
  if (qty < 1) return;

  await updateDoc(ref, { quantity: qty });
  cartData();
  loadCartBadge();
};

window.placeOrder = async function () {
  const cartSnapshot = await getDocs(collection(db, "carts"));

  if (cartSnapshot.empty) {
    Swal.fire({
      title: "Cart is Empty",
      text: "Please add items to your cart before placing an order.",
      icon: "warning"
    });
    return;
  }

  let orderItems = [];
  let totalAmount = 0;

  cartSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    orderItems.push({ ...data });
    totalAmount += data.price * data.quantity;
  });

  const order = {
    items: orderItems,
    totalAmount,
    timestamp: new Date().toISOString()
  };

  try {
    const orderRef = await addDoc(collection(db, "orders"), order);

    // Clear the cart
    const deletions = cartSnapshot.docs.map(docSnap => deleteDoc(doc(db, "carts", docSnap.id)));
    await Promise.all(deletions);

    Swal.fire({
      title: "Order Placed!",
      html: `Your order (<b>ID: ${orderRef.id}</b>) was placed successfully.`,
      icon: "success"
    });

    cartData();
    loadCartBadge();
  } catch (error) {
    console.error("Error placing order: ", error);
    Swal.fire({
      title: "Error",
      text: "There was a problem placing your order. Please try again.",
      icon: "error"
    });
  }
};
