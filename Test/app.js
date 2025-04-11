import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";

document.addEventListener('DOMContentLoaded', () => {
    const loadingAnimation = document.getElementById('page-load-animation');
    setTimeout(() => {
        loadingAnimation.style.display = 'none';
    }, 2000);
});
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";

const NameInput = document.getElementById("name-input");
const PasswordInput = document.getElementById("password-input");
const Form = document.getElementsByTagName("form")[0];
const Posts = document.getElementsByClassName("posts")[0];
const UserToBlock = document.getElementById("user-to-block");
const Block = document.getElementById("block");
const Unblock = document.getElementById("unblock")

const ModalHTML = `<div class="modal"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="white"></path></svg><p>არასწორი მონაცემები</p><button id="modal-button" onclick="this.parentElement.remove()">x</button></div>`;
const PostHTML = `<div class="post"><div class="post-head"><div class="profile-image"></div><p class="post-developer"></p><p class="post-date"></p></div><p class="post-text"></p><img src="" class="post-image"><button class="submit-delete">წაშლა</button><p class="id"></p></div>`;

const Url = "https://speakup-admin.onrender.com/getConfig";

// Help button functionality moved outside of OnSubmit
const HelpButton = document.getElementById("help-button");
if (HelpButton) {
    HelpButton.addEventListener("click", () => {
        const modalsContainer = document.getElementById("modals");
        if (modalsContainer) {
            const HelpModalHTML = `
                <div class="help-modal">
                    <h2 style="color:blue; margin-bottom:20px;">პოსტის წაშლის ინსტრუქცია</h2>
                    <ol>
                        <li>შეიყვანეთ ანგარიშის სახელი ველში</li>
                        <li>დააჭირეთ ღილაკს "ანგარიშის პოსტები"</li>
                        <li>იპოვეთ სასურველი პოსტი</li>
                        <li>დააჭირეთ ღილაკს "წაშლა" პოსტის ქვემოთ</li>
                    </ol>
                    <button id="modal-button" onclick="this.parentElement.remove()" style="
                        background: white;
                        color: #4285f4;
                        padding: 10px 20px;
                        border-radius: 5px;
                        font-weight: bold;
                        cursor: pointer;
                    ">დახურვა</button>
                </div>
            `;
            modalsContainer.innerHTML = '';
            modalsContainer.insertAdjacentHTML('beforeend', HelpModalHTML);
        } else {
            console.error('Modals container not found');
        }
    });
}

async function ResponseHandling(Response)
{
    if (Response.ok)
    {
        return await Response.json();
    }

    document.getElementById("modals").innerHTML += ModalHTML;
    return await null;
};

async function Get_Id_By_Fullname(db, Fullname)
{
    const UsersCollection = collection(db, "personal-info");
    const User = where("FullName", "==", Fullname);

    const Query = query(UsersCollection, User);
    const QuerySnapshot = await getDocs(Query);

    if (QuerySnapshot.empty)
    {
        return await null;
    }
    else
    {
        let Id = null;

        QuerySnapshot.forEach((DocumentReference) => {
            Id = DocumentReference.id;
        });

        return await Id;
    };
};

async function Get_Posts(db, Id)
{
    const PostsCollection = collection(db, "personal-info", Id, "posts");
    const QuerySnapshot = await getDocs(PostsCollection);

    const Posts = [];
    
    for (const Doc of QuerySnapshot.docs)
    {
        const Post = { id: Doc.id, data: Doc.data() };

        Posts.push(Post);
    };

    return await Posts;
}

async function OnSubmit(SubmitEvent)
{
    SubmitEvent.preventDefault();
    
    // Show loading animation
    const loadingAnimation = document.getElementById('page-load-animation');
    loadingAnimation.style.display = 'flex';
    
    const Endpoint = `${Url}/${NameInput.value}/${PasswordInput.value}`;
    const Response = await fetch(Endpoint);
    const Result = await ResponseHandling(Response);
    
    if (Result)
    {
        // Hide loading animation
        loadingAnimation.style.display = 'none';
        document.querySelector(".auth").style.display = "none";
        document.querySelector(".admin").style.display = "flex";

        const firebaseConfig = {
            apiKey: "AIzaSyD93WyvlqmBo_CkChloCabFARucdoDILIA",
            authDomain: "facebook-clone-fe696.firebaseapp.com",
            projectId: "facebook-clone-fe696",
            storageBucket: "facebook-clone-fe696.appspot.com",
            messagingSenderId: "172533380090",
            appId: "1:172533380090:web:2f80ab7f5f80d7cefdaa43",
            measurementId: "G-2GH8KQ7ZNX"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        async function block()
        {
            const name = UserToBlock.value.trim();
            const UsersCollection = collection(db, "personal-info");
            const UserQuery = query(UsersCollection, where("FullName", "==", name));
            const querySnapshot = await getDocs(UserQuery);

            if (querySnapshot.empty)
            {
                console.log("User not found.");
                return;
            }

            querySnapshot.forEach(async (DocumentSnapshot) => {
                const UserReference = doc(db, "personal-info", DocumentSnapshot.id);
                await updateDoc(UserReference, { blocked: true });
                console.log(`User ${name}, was blocked`);
            });
        }

        async function unblock()
        {
            const name = UserToBlock.value.trim();
            const UsersCollection = collection(db, "personal-info");
            const UserQuery = query(UsersCollection, where("FullName", "==", name));
            const querySnapshot = await getDocs(UserQuery);

            if (querySnapshot.empty)
            {
                console.log("User not found.");
                return;
            }

            querySnapshot.forEach(async (DocumentSnapshot) => {
                const UserReference = doc(db, "personal-info", DocumentSnapshot.id);
                await updateDoc(UserReference, { blocked: false });
                console.log(`User ${name}, was unblocked`);
            });
        }
        
        Block.addEventListener("click", block)        
        Unblock.addEventListener("click", unblock)

        async function Delete_Post(Event)
        {
            const Post = Event.target.parentElement;
            const PostInf = Post.querySelector(".id").innerHTML;
            let Data = PostInf.replace(/(\w+):/g, '"$1":');
            Data = JSON.parse(Data)

            const DocumentReference = doc(db, "personal-info", Data.uid, "posts", Data.id);
        
            await deleteDoc(DocumentReference);
            Post.remove();
        }
        
        function Create_Post(Name, Text, Date, ImageUrl, Id, UserId)
        {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = PostHTML.trim();
        
            const NewPost = tempDiv.querySelector(".post");
        
            NewPost.querySelector(".post-developer").textContent = Name;
            NewPost.querySelector(".post-text").textContent = Text;
            NewPost.querySelector(".post-date").textContent = Date;
            NewPost.querySelector(".post-image").src = ImageUrl;
            NewPost.querySelector(".id").textContent = `{id:"${Id}",uid:"${UserId}"}`;
        
            const DeleteButton = NewPost.querySelector(".submit-delete");
            DeleteButton.addEventListener("click", Delete_Post)
        
            Posts.prepend(NewPost);
        }        
            
        async function OnSearch() {
            const UsersCollection = collection(db, "personal-info");
            const UsersSnapshot = await getDocs(UsersCollection);
        
            for (const UserDoc of UsersSnapshot.docs) {
                const UserId = UserDoc.id;
                const PostsArray = await Get_Posts(db, UserId);
        
                PostsArray.forEach((Post) => {
                    Create_Post(Post.data.name, Post.data.text, Post.data.date, Post.data.photoURL, Post.id, UserId);
                });
            }
        }        

        const Search = document.getElementById("search");
        Search.addEventListener("click", async () => {
            // Show main loading animation
            const loadingAnimation = document.getElementById('page-load-animation');
            loadingAnimation.style.display = 'flex';
            
            // Clear posts container
            const postsContainer = document.querySelector(".posts");
            postsContainer.innerHTML = '';

            // Fetch posts
            await OnSearch();
            
            // Hide loading animation when done
            loadingAnimation.style.display = 'none';
        });
    }
    else
    {
        // Hide loading animation on failure too
        loadingAnimation.style.display = 'none';
    };
};

Form.addEventListener("submit", OnSubmit);

// Forgot work day button functionality
const ForgotDayButton = document.getElementById("forgot-day");
if (ForgotDayButton) {
    ForgotDayButton.addEventListener("click", () => {
        window.location.href = "mailto:otogg3@gmail.com?subject=დავიწყე სამუშაო დღე&body=გამარჯობა,%0D%0A%0D%0Aდავიწყე სამუშაო დღე.%0D%0A%0D%0Aგმადლობთ";
    });
}

// Rules modal functionality
const RulesButton = document.getElementById("rules-button");
const rulesModal = document.querySelector('.rules-modal');

if (RulesButton && rulesModal) {
    // Initialize modal state
    rulesModal.style.display = 'none';
    
    // Show modal on button click
    RulesButton.addEventListener("click", (e) => {
        e.stopPropagation();
        rulesModal.style.display = 'flex';
    });

    // Close modal when clicking close button
    const closeButton = rulesModal.querySelector('.close-rules');
    if (closeButton) {
        closeButton.addEventListener("click", (e) => {
            e.stopPropagation();
            rulesModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (rulesModal.style.display === 'flex' && 
            !rulesModal.contains(e.target) && 
            e.target !== RulesButton) {
            rulesModal.style.display = 'none';
        }
    });
} else {
    console.error('Could not find required elements for rules modal');
}
