import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    onValue,
    remove
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA8whWMsqzfuQJiq9A3ShwHZ2o029VtPAk",
    authDomain: "idea-map-44e45.firebaseapp.com",
    projectId: "idea-map-44e45",
    storageBucket: "idea-map-44e45.firebasestorage.app",
    messagingSenderId: "139898991681",
    appId: "1:139898991681:web:15742eb6d1f49e3b9642c0",
    measurementId: "G-7JEMF9E1S9"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(
    app,
    "https://idea-map-44e45-default-rtdb.asia-southeast1.firebasedatabase.app"
);

const parentSelect =
    document.getElementById("parentWork");

const ideaInput =
    document.getElementById("idea");

let records = [];

/* --------------------
   表示更新
-------------------- */

function updateScreen() {

    const list =
        document.getElementById("list");

    list.innerHTML = "";

    parentSelect.innerHTML =
        '<option value="">なし</option>';

    records.forEach(data => {

        parentSelect.add(
            new Option(
                data.workName,
                data.workId
            )
        );

        let parentText = "なし";

        if(data.parentWork !== ""){

            const parent =
                records.find(r =>
                    r.workId ==
                    data.parentWork
                );

            if(parent){
                parentText =
                    parent.workName;
            }

        }

        list.innerHTML += `
            <div>
                ${data.workName}
                ←
                ${parentText}
                （${data.idea}）
            </div>
            <hr>
        `;

    });

    const nodes =
        new vis.DataSet(

            records.map(data => ({

                id: data.workId,
                label: data.workName

            }))

        );

    const edges =
        new vis.DataSet(

            records
            .filter(data =>
                data.parentWork !== ""
            )
            .map(data => ({

                from:
                    Number(
                        data.parentWork
                    ),

                to:
                    data.workId,

                arrows: "to",

                label:
                    data.idea

            }))

        );

    const container =
        document.getElementById("map");

    new vis.Network(

        container,

        {
            nodes,
            edges
        },

        {
            layout: {
                hierarchical: {
                    direction: "LR"
                }
            },

            physics: false
        }

    );

}

/* --------------------
   Firebase読込
-------------------- */

onValue(
    ref(db, "ideas"),
    (snapshot) => {

        records = [];

        const data =
            snapshot.val();

        if(data){

            Object.keys(data)
            .forEach(key => {

                records.push(
                    data[key]
                );

            });

        }

        updateScreen();

    }
);

/* --------------------
   送信
-------------------- */

document
.getElementById("sendBtn")
.addEventListener("click", () => {

    const workName =
        document
        .getElementById("workName")
        .value
        .trim();

    const parentWork =
        document
        .getElementById("parentWork")
        .value;

    const idea =
        document
        .getElementById("idea")
        .value
        .trim();

    if(workName === ""){
        return;
    }

    push(
        ref(db, "ideas"),
        {
            workId:
                Date.now(),

            workName:
                workName,

            parentWork:
                parentWork,

            idea:
                idea
        }
    );

    document
        .getElementById("workName")
        .value = "";

    document
        .getElementById("idea")
        .value = "なし";

});

/* --------------------
   全削除
-------------------- */

document
.getElementById("clearBtn")
.addEventListener("click", () => {

    if(
        confirm(
            "全部消しますか？"
        )
    ){

        remove(
            ref(db, "ideas")
        );

    }

});

/* --------------------
   なし設定
-------------------- */

ideaInput.value = "なし";
ideaInput.disabled = true;

parentSelect
.addEventListener(
    "change",
    () => {

        if(
            parentSelect.value === ""
        ){

            ideaInput.value =
                "なし";

            ideaInput.disabled =
                true;

        }
        else{

            if(
                ideaInput.value
                === "なし"
            ){

                ideaInput.value =
                    "";

            }

            ideaInput.disabled =
                false;

        }

    }
);