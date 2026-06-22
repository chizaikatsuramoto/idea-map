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

        if (data.parentWork !== "") {

            const parent =
                records.find(
                    r =>
                    r.workId ==
                    data.parentWork
                );

            if (parent) {
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
            .filter(
                data =>
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

    const network =
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

    network.on(
        "click",
        function(params){

            if(
                params.nodes.length === 0
            ){
                return;
            }

            const nodeId =
                params.nodes[0];

            const work =
                records.find(
                    r =>
                    r.workId ==
                    nodeId
                );

            if(!work){
                return;
            }

            let dateText =
                "記録なし";

            if(work.timestamp){

                dateText =
                    new Date(
                        work.timestamp
                    )
                    .toLocaleString(
                        "ja-JP"
                    );
            }

            alert(
                "作品名：" +
                work.workName +
                "\n\n投稿日時：" +
                dateText
            );
        }
    );
}

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
   投稿
-------------------- */

document
.getElementById("sendBtn")
.addEventListener(
    "click",
    () => {

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

        const workId =
            Date.now();

        push(
            ref(db, "ideas"),
            {

                workId:
                    workId,

                workName:
                    workName,

                parentWork:
                    parentWork,

                idea:
                    idea,

                timestamp:
                    Date.now()

            }
        );

        document
            .getElementById("workName")
            .value = "";

        document
            .getElementById("idea")
            .value = "なし";
    }
);

/* --------------------
   全削除
-------------------- */

document
.getElementById("clearBtn")
.addEventListener(
    "click",
    () => {

        if(
            confirm(
                "全部消しますか？"
            )
        ){

            remove(
                ref(
                    db,
                    "ideas"
                )
            );
        }
    }
);

/* --------------------
   スプレッドシート出力
-------------------- */

const sheetBtn =
    document.getElementById(
        "sheetBtn"
    );

if(sheetBtn){

    sheetBtn.addEventListener(
        "click",
        exportToSheet
    );

}

function exportToSheet(){

    fetch(
        "https://script.google.com/macros/s/AKfycbzaGPjXRZq5piHWcZfe8cCLG7VuFemwoofS2s61jcIbmqatRupoKq0jpXz36Qk7RLWpeQ/exec",
        {
            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type":
                    "text/plain"
            },

            body: JSON.stringify(
                records
            )
        }
    );

    alert(
        "スプレッドシートへ送信しました"
    );
}

/* --------------------
   入力制御
-------------------- */

ideaInput.value =
    "なし";

ideaInput.disabled =
    true;

parentSelect
.addEventListener(
    "change",
    () => {

        if(
            parentSelect.value
            === ""
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
    });
