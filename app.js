import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc ,
  updateDoc, 
  deleteField,
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

onAuthStateChanged(auth, (user) => {
    const path = location.pathname;
  
    if (user) {
      const uid = user.uid;
      console.log("User is Signed in with UID:", uid);
  
      // Show content only if on admin page
      if (path === "/admin.html") {
        document.getElementById("adminContent").style.display = "block";
      }
  
      if (path === "/index.html" || path === "/login.html") {
        setTimeout(() => {
          location.href = "./admin.html";
        }, 2000);
      }
    } else {
      console.log("User not logged in");
  
      if (path === "/admin.html") {
        setTimeout(() => {
          location.href = "./login.html";
        }, 2000);
      }
    }
  });
  

function submitForm() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      Swal.fire({
        title: "User SignedUp Successfully!",
        text: `${user.email}`,
        icon: "success",
      });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Invalid Credentials",
      });
    });
}
window.submitForm = submitForm;

function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      Swal.fire({
        title: "User SignedIn Successfully!",
        text: `${user.email}`,
        icon: "success",
      }).then(() => {
        location.href = "./admin.html";
      });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Invalid Credentials",
      });
    });
}

window.login = login;

function logoutUser() {
  signOut(auth)
    .then(() => {
      Swal.fire({
        title: "User Signed Out Successfully!",
        text: "Bye Bye",
        icon: "success",
      }).then(() => {
        window.location.href = "login.html";
      });
    })
    .catch((error) => {
      console.error("Error signing out:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Invalid Credentials",
      });
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
async function userData(){
  const querySnapshot = await getDocs(collection(db, "items"));
  querySnapshot.forEach((doc) => {
    userDiv.innerHTML += `
        <div class="card" style="width: 18rem;">
    <img src="${doc.data().product_url}" class="card-img-top" alt="Image" style="height: 200px; object-fit: cover;">
  <div class="card-body">
    <h5 class="card-title">${doc.data().product_name}</h5>
    <p class="card-text">${doc.data().product_des}</p>
    <h5 class="card-title">${doc.data().product_price}</h5>
    </div>
    <button onclick='addtocart("${doc.id}", "${doc.data().product_name}", "${doc.data().product_price}", "${doc.data().product_des}", "${doc.data().product_url}")' class='btn btn-primary m-2'> Add to Cart</button>
</div>
      `;
  });
}
if(userDiv){ //only for user
  userData();
}

let num =0
const cart = document.getElementById('cart-badge');
async function addtocart(id, name, price, desc, url){
  try {
    const docRef = await addDoc(collection(db, "carts"), {
      id:id,
      name:name,
      price:price,
      desc:desc,
      url:url,
    });
    Swal.fire({
      title: "Product Add to cart Successfully!",
      text: `Your Order Id : ${docRef.id}`,
      icon: "success",
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }

  num++;
  cart.innerHTML =num;
}
window.addtocart = addtocart;

let showCart = document.getElementById('showCart');
async function cartData(){
  const querySnapshot = await getDocs(collection(db, "carts"));
  querySnapshot.forEach((doc) => {
    showCart.innerHTML += `
        <div class="card" style="width: 18rem;">
    <img src="${doc.data().url}" class="card-img-top" alt="Image" style="height: 200px; object-fit: cover;">
  <div class="card-body">
    <h5 class="card-title">${doc.data().name}</h5>
    <p class="card-text">${doc.data().desc}</p>
    <h5 class="card-title">${doc.data().price}</h5>
    </div>
    <div class="d-flex justify-content-around">
    <button class="btn btn-warning">+</button>
    <button class="btn btn-danger">-</button>
    </div>
</div>
      `;
  });
}
if(showCart){
  cartData();
}