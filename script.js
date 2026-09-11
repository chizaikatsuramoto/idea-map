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


/* =========================================================
   Firebase設定
========================================================= */

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


/* =========================================================
   HTML要素
========================================================= */

const workNameInput =
    document.getElementById("workName");

const parentSelect =
    document.getElementById("parentWork");

const ideaInput =
    document.getElementById("idea");

const sendBtn =
    document.getElementById("sendBtn");

const clearBtn =
    document.getElementById("clearBtn");

const csvBtn =
    document.getElementById("csvBtn");

const sheetBtn =
    document.getElementById("sheetBtn");

const list =
    document.getElementById("list");

const mapContainer =
    document.getElementById("map");


/* =========================================================
   データ
========================================================= */

let records = [];

/* 現在表示しているvis.Network */
let network = null;

/* 二重送信防止 */
let sending = false;


/* =========================================================
   メッセージ表示
========================================================= */

function showMessage(message, type = "info") {

    let messageBox =
        document.getElementById("messageBox");

    if (!messageBox) {

        messageBox =
            document.createElement("div");

        messageBox.id =
            "messageBox";

        messageBox.style.marginTop =
            "10px";

        messageBox.style.padding =
            "10px";

        messageBox.style.borderRadius =
            "8px";

        messageBox.style.fontWeight =
            "bold";

        if (sendBtn && sendBtn.parentNode) {

            sendBtn.parentNode.insertBefore(
                messageBox,
                sendBtn.nextSibling
            );
        }
    }

    messageBox.textContent =
        message;

    if (type === "success") {

        messageBox.style.backgroundColor =
            "#e8f5e9";

        messageBox.style.color =
            "#2e7d32";

    }
    else if (type === "error") {

        messageBox.style.backgroundColor =
            "#ffebee";

        messageBox.style.color =
            "#c62828";

    }
    else {

        messageBox.style.backgroundColor =
            "#eeeeee";

        messageBox.style.color =
            "#333333";
    }
}


/* =========================================================
   作品ID
========================================================= */

function createWorkId() {

    return Date.now().toString()
        + "-"
        + Math.random()
            .toString(36)
            .substring(2, 8);
}


/* =========================================================
   画面更新
========================================================= */

function updateScreen() {

    try {

        /* -----------------------------------------
           作品一覧
        ----------------------------------------- */

        if (list) {

            list.innerHTML = "";
        }


        /* -----------------------------------------
           参考作品選択
        ----------------------------------------- */

        if (parentSelect) {

            parentSelect.innerHTML =
                '<option value="">なし</option>';

            records.forEach(data => {

                if (!data.workId) {
                    return;
                }

                const option =
                    new Option(
                        data.workName || "名称なし",
                        data.workId
                    );

                parentSelect.add(option);
            });
        }


        /* -----------------------------------------
           作品一覧表示
        ----------------------------------------- */

        if (list) {

            records.forEach(data => {

                let parentText =
                    "なし";

                if (
                    data.parentWork !== "" &&
                    data.parentWork != null
                ) {

                    const parent =
                        records.find(
                            r =>
                                String(r.workId) ===
                                String(data.parentWork)
                        );

                    if (parent) {

                        parentText =
                            parent.workName || "名称なし";
                    }
                }


                const item =
                    document.createElement("div");

                item.textContent =
                    `${data.workName || "名称なし"} ← ${parentText}（${data.idea || "なし"}）`;

                list.appendChild(item);


                const hr =
                    document.createElement("hr");

                list.appendChild(hr);
            });
        }


        /* -----------------------------------------
           vis-networkが存在するか確認
        ----------------------------------------- */

        if (
            typeof vis === "undefined" ||
            typeof vis.DataSet === "undefined" ||
            typeof vis.Network === "undefined"
        ) {

            console.warn(
                "vis-networkが読み込まれていません。"
            );

            if (mapContainer) {

                mapContainer.innerHTML =
                    "マップを読み込めませんでした。<br>" +
                    "作品データは保存されています。";

                mapContainer.style.padding =
                    "20px";

                mapContainer.style.textAlign =
                    "center";
            }

            return;
        }


        /* -----------------------------------------
           古いNetworkを破棄
        ----------------------------------------- */

        if (network) {

            try {
                network.destroy();
            }
            catch (error) {

                console.warn(
                    "Network破棄時のエラー:",
                    error
                );
            }

            network = null;
        }


        /* -----------------------------------------
           ノード
        ----------------------------------------- */

        const nodes =
            new vis.DataSet(

                records.map(data => ({

                    id:
                        String(data.workId),

                    label:
                        data.workName ||
                        "名称なし"

                }))
            );


        /* -----------------------------------------
           エッジ
        ----------------------------------------- */

        const edges =
            new vis.DataSet(

                records
                    .filter(
                        data =>
                            data.parentWork !== "" &&
                            data.parentWork != null
                    )
                    .map(data => ({

                        from:
                            String(data.parentWork),

                        to:
                            String(data.workId),

                        arrows:
                            "to",

                        label:
                            data.idea || ""

                    }))
            );


        /* -----------------------------------------
           Network作成
        ----------------------------------------- */

        if (mapContainer) {

            mapContainer.innerHTML = "";

            network =
                new vis.Network(

                    mapContainer,

                    {
                        nodes,
                        edges
                    },

                    {
                        layout: {

                            hierarchical: {

                                direction: "LR",

                                sortMethod: "directed",

                                levelSeparation: 150,

                                nodeSpacing: 100
                            }
                        },

                        physics: false,

                        interaction: {

                            dragNodes: true,

                            zoomView: true,

                            dragView: true
                        }
                    }
                );


            /* -----------------------------------------
               ノードクリック
            ----------------------------------------- */

            network.on(
                "click",
                function(params) {

                    if (
                        !params.nodes ||
                        params.nodes.length === 0
                    ) {
                        return;
                    }


                    const nodeId =
                        String(params.nodes[0]);


                    const work =
                        records.find(
                            r =>
                                String(r.workId) ===
                                nodeId
                        );


                    if (!work) {
                        return;
                    }


                    let dateText =
                        "記録なし";


                    if (work.timestamp) {

                        const date =
                            new Date(
                                work.timestamp
                            );

                        if (
                            !isNaN(
                                date.getTime()
                            )
                        ) {

                            dateText =
                                date.toLocaleString(
                                    "ja-JP"
                                );
                        }
                    }


                    alert(
                        "作品名：" +
                        (work.workName || "名称なし") +
                        "\n\n投稿日時：" +
                        dateText
                    );
                }
            );
        }

    }
    catch (error) {

        console.error(
            "画面更新エラー:",
            error
        );

        showMessage(
            "画面の更新でエラーが発生しました。",
            "error"
        );
    }
}


/* =========================================================
   Firebaseからデータ読み込み
========================================================= */

onValue(
    ref(db, "ideas"),

    (snapshot) => {

        try {

            records = [];

            const data =
                snapshot.val();


            if (data) {

                Object.keys(data)
                    .forEach(key => {

                        if (data[key]) {

                            records.push(
                                data[key]
                            );
                        }
                    });
            }


            /*
             * 時刻順に並べる
             */
            records.sort(
                (a, b) =>
                    Number(a.timestamp || 0) -
                    Number(b.timestamp || 0)
            );


            updateScreen();


            if (records.length > 0) {

                showMessage(
                    `現在 ${records.length} 件の作品があります。`,
                    "info"
                );
            }

        }
        catch (error) {

            console.error(
                "データ処理エラー:",
                error
            );

            showMessage(
                "データの表示に失敗しました。",
                "error"
            );
        }
    },

    (error) => {

        console.error(
            "Firebase読み込みエラー:",
            error
        );

        showMessage(
            "データを読み込めませんでした。通信状態を確認してください。",
            "error"
        );

        if (mapContainer) {

            mapContainer.innerHTML =
                "データを読み込めませんでした。";

        }
    }
);


/* =========================================================
   投稿
========================================================= */

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        async () => {

            /* -----------------------------------------
               二重送信防止
            ----------------------------------------- */

            if (sending) {
                return;
            }


            /* -----------------------------------------
               入力取得
            ----------------------------------------- */

            const workName =
                workNameInput
                    ? workNameInput.value.trim()
                    : "";


            const parentWork =
                parentSelect
                    ? parentSelect.value
                    : "";


            let idea =
                ideaInput
                    ? ideaInput.value.trim()
                    : "なし";


            if (idea === "") {

                idea = "なし";
            }


            /* -----------------------------------------
               作品名チェック
            ----------------------------------------- */

            if (workName === "") {

                showMessage(
                    "作品名を入力してください。",
                    "error"
                );

                if (workNameInput) {

                    workNameInput.focus();
                }

                return;
            }


            /* -----------------------------------------
               ID作成
            ----------------------------------------- */

            const workId =
                createWorkId();


            const timestamp =
                Date.now();


            const newRecord = {

                workId:
                    workId,

                workName:
                    workName,

                parentWork:
                    parentWork,

                idea:
                    idea,

                timestamp:
                    timestamp
            };


            /* -----------------------------------------
               送信中
            ----------------------------------------- */

            sending = true;

            sendBtn.disabled = true;

            sendBtn.textContent =
                "送信中…";


            showMessage(
                "保存しています…",
                "info"
            );


            try {

                /*
                 * Firebaseへ保存
                 *
                 * awaitすることで、
                 * 保存成功を確認してから
                 * 入力欄を消す
                 */

                await push(
                    ref(db, "ideas"),
                    newRecord
                );


                /* -----------------------------------------
                   保存成功
                ----------------------------------------- */

                showMessage(
                    "✅ 保存しました！",
                    "success"
                );


                /*
                 * 成功したときだけ入力欄を消す
                 */

                if (workNameInput) {

                    workNameInput.value = "";
                }


                if (ideaInput) {

                    ideaInput.value =
                        "なし";

                    ideaInput.disabled =
                        true;
                }


                if (parentSelect) {

                    parentSelect.value =
                        "";
                }


            }
            catch (error) {

                console.error(
                    "Firebase保存エラー:",
                    error
                );


                /*
                 * 保存失敗時は
                 * 入力内容を消さない
                 */

                showMessage(
                    "⚠️ 保存できませんでした。通信状態を確認して、もう一度送信してください。",
                    "error"
                );
            }
            finally {

                sending = false;

                sendBtn.disabled = false;

                sendBtn.textContent =
                    "送信";
            }
        }
    );
}


/* =========================================================
   全削除
========================================================= */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        async () => {

            const result =
                confirm(
                    "全部消しますか？"
                );


            if (!result) {
                return;
            }


            clearBtn.disabled =
                true;


            try {

                await remove(
                    ref(db, "ideas")
                );


                showMessage(
                    "データを削除しました。",
                    "success"
                );

            }
            catch (error) {

                console.error(
                    "削除エラー:",
                    error
                );

                showMessage(
                    "データを削除できませんでした。",
                    "error"
                );

            }
            finally {

                clearBtn.disabled =
                    false;
            }
        }
    );
}


/* =========================================================
   CSV出力
========================================================= */

if (csvBtn) {

    csvBtn.addEventListener(
        "click",
        exportCSV
    );
}


function exportCSV() {

    try {

        let csv =
            "作品名,参考作品,参考内容,投稿日時\n";


        records.forEach(data => {

            let parentName =
                "なし";


            if (
                data.parentWork !== "" &&
                data.parentWork != null
            ) {

                const parent =
                    records.find(
                        r =>
                            String(r.workId) ===
                            String(data.parentWork)
                    );


                if (parent) {

                    parentName =
                        parent.workName || "名称なし";
                }
            }


            let date =
                "";


            if (data.timestamp) {

                const d =
                    new Date(
                        data.timestamp
                    );


                if (
                    !isNaN(
                        d.getTime()
                    )
                ) {

                    date =
                        d.toLocaleString(
                            "ja-JP"
                        );
                }
            }


            const workName =
                String(
                    data.workName || ""
                )
                .replace(/"/g, '""');


            const parentText =
                String(
                    parentName
                )
                .replace(/"/g, '""');


            const ideaText =
                String(
                    data.idea || ""
                )
                .replace(/"/g, '""');


            csv +=
                `"${workName}",` +
                `"${parentText}",` +
                `"${ideaText}",` +
                `"${date}"\n`;

        });


        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const a =
            document.createElement("a");


        a.href =
            url;

        a.download =
            "idea_log.csv";


        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);


        setTimeout(
            () => {
                URL.revokeObjectURL(url);
            },
            1000
        );


        showMessage(
            "CSVを作成しました。",
            "success"
        );

    }
    catch (error) {

        console.error(
            "CSV出力エラー:",
            error
        );

        showMessage(
            "CSVの作成に失敗しました。",
            "error"
        );
    }
}


/* =========================================================
   スプレッドシート出力
========================================================= */

if (sheetBtn) {

    sheetBtn.addEventListener(
        "click",
        exportToSheet
    );
}


async function exportToSheet() {

    try {

        const exportData =
            records.map(record => {

                let parentName =
                    "なし";


                if (
                    record.parentWork !== "" &&
                    record.parentWork != null
                ) {

                    const parent =
                        records.find(
                            r =>
                                String(r.workId) ===
                                String(record.parentWork)
                        );


                    if (parent) {

                        parentName =
                            parent.workName ||
                            "名称なし";
                    }
                }


                return {

                    timestamp:
                        record.timestamp,

                    workName:
                        record.workName,

                    parentWork:
                        parentName,

                    idea:
                        record.idea,

                    workId:
                        record.workId
                };

            });


        await fetch(
            "https://script.google.com/macros/s/AKfycbzaGPjXRZq5piHWcZfe8cCLG7VuFemwoofS2s61jcIbmqatRupoKq0jpXz36Qk7RLWpeQ/exec",
            {
                method: "POST",

                mode: "no-cors",

                headers: {
                    "Content-Type":
                        "text/plain"
                },

                body:
                    JSON.stringify(
                        exportData
                    )
            }
        );


        alert(
            "スプレッドシートへ送信しました"
        );

    }
    catch (error) {

        console.error(
            "スプレッドシート送信エラー:",
            error
        );

        alert(
            "スプレッドシートへの送信に失敗しました。"
        );
    }
}


/* =========================================================
   入力制御
========================================================= */

if (ideaInput) {

    ideaInput.value =
        "なし";

    ideaInput.disabled =
        true;
}


if (parentSelect) {

    parentSelect.addEventListener(
        "change",
        () => {

            if (
                parentSelect.value === ""
            ) {

                if (ideaInput) {

                    ideaInput.value =
                        "なし";

                    ideaInput.disabled =
                        true;
                }

            }
            else {

                if (ideaInput) {

                    if (
                        ideaInput.value ===
                        "なし"
                    ) {

                        ideaInput.value =
                            "";
                    }

                    ideaInput.disabled =
                        false;
                }
            }
        }
    );
}


/* =========================================================
   起動確認
========================================================= */

console.log(
    "みんなのアイデアマップ 起動"
);
