import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc} from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";

const NameInput = document.getElementById("name-input");
const PasswordInput = document.getElementById("password-input");
const Form = document.getElementsByTagName("form")[0];
const Posts = document.getElementsByClassName("posts")[0];

const ModalHTML = `<div class="modal"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="white"></path></svg><p>არასწორი მონაცემები</p><button id="modal-button" onclick="this.parentElement.remove()">x</button></div>`;
const PostHTML = `<div class="post"><div class="post-head"><div class="profile-image"></div><p class="post-developer"></p><p class="post-date"></p></div><p class="post-text"></p><img src="" class="post-image"><button class="submit-delete">წაშლა</button><p class="id"></p></div>`;

const Url = "https://render-speakup-api.onrender.com/getConfig";


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
    
    const Endpoint = `${Url}/${NameInput.value}/${PasswordInput.value}`;
    const Response = await fetch(Endpoint);
    const Result = await ResponseHandling(Response);
    
    if (Result)
    {
        document.querySelector(".auth").style.display = "none";
        document.querySelector(".admin").style.display = "flex";
        
        const app = initializeApp(Result);
        const db = getFirestore(app);

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
            
        async function OnSearch()
        {
            const TargetFullname = document.getElementById("target-name").value;
            const Id = await Get_Id_By_Fullname(db, TargetFullname);
            const Posts = await Get_Posts(db, Id);

            Posts.forEach((Post) => {
                Create_Post(Post.data.name, Post.data.text, Post.data.date, Post.data.photoURL, Post.id, Id)
            })
        };

        const Search = document.getElementById("search");
        Search.addEventListener("click", OnSearch);
    }
    else
    {
        console.error("unauthorized");
    };
};

Form.addEventListener("submit", OnSubmit);