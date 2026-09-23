// ========================================
// アイデアつながりマップ
// Firebase Realtime Database版
// ========================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    onValue,
    remove
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";


// ========================================
// Firebase設定
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyA8whWMsqzfuQJiq9A3ShwHZ2o029VtPAk",
    authDomain: "idea-map-44e45.firebaseapp.com",
    databaseURL: "https://idea-map-44e45-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "idea-map-44e45",
    storageBucket: "idea-map-44e45.firebasestorage.app",
    messagingSenderId: "139898991681",
    appId: "1:139898991681:web:15742eb6d1f49e3b9642c0",
    measurementId: "G-7JEMF9E1S9"
};


// ========================================
// Firebase開始
// ========================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const ideasRef = ref(db, "ideas");


// ========================================
// 現在の作品データ
// ========================================

let records = [];


// ========================================
// 参考にした作品の選択肢
// ========================================

function updateParentWork() {

    const parentWork =
        document.getElementById("parentWork");

    if (!parentWork) {
        return;
    }

    parentWork.innerHTML =
        '<option value="">なし</option>';

    records.forEach(data => {

        if (!data) {
            return;
        }

        const option =
            new Option(
                data.workName,
                data.id
            );

        parentWork.appendChild(option);

    });

}


// ========================================
// 一覧表示
// ========================================

function showList() {

    const list =
        document.getElementById("list");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    records.forEach(data => {

        if (!data) {
            return;
        }

        let parentText = "なし";

        if (
            data.parentWork &&
            data.parentWork !== ""
        ) {

            const parent =
                records.find(
                    item =>
                        item.id ===
                        data.parentWork
                );

            if (parent) {
                parentText =
                    parent.workName;
            }

        }

        list.innerHTML += `
            <div>
                ${escapeHTML(data.workName)}
                ←
                ${escapeHTML(parentText)}
                （${escapeHTML(data.idea || "")}）
            </div>
            <hr>
        `;

    });

}


// ========================================
// HTML文字を安全に表示
// ========================================

function escapeHTML(text) {

    if (
        text === null ||
        text === undefined
    ) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ========================================
// マップ表示
// ========================================

function showMap() {

    const map =
        document.getElementById("map");

    if (!map) {
        return;
    }


    // -------------------------------
    // ノード
    // -------------------------------

    const nodeData = [];

    records.forEach(data => {

        if (!data) {
            return;
        }

        nodeData.push({

            id: data.id,

            label: data.workName,

            shape: "box",

            margin: 12,

            font: {
                size: 20
            }

        });

    });


    const nodes =
        new vis.DataSet(nodeData);


    // -------------------------------
    // 矢印
    // -------------------------------

    const edgeData = [];

    records.forEach(data => {

        if (
            data.parentWork &&
            data.parentWork !== ""
        ) {

            const parentExists =
                records.some(
                    item =>
                        item.id ===
                        data.parentWork
                );

            if (parentExists) {

                edgeData.push({

                    from:
                        data.parentWork,

                    to:
                        data.id,

                    arrows:
                        "to",

                    label:
                        data.idea || "",

                    font: {
                        size: 18,
                        align: "middle"
                    }

                });

            }

        }

    });


    const edges =
        new vis.DataSet(edgeData);


    // -------------------------------
    // マップ設定
    // -------------------------------

    const networkData = {

        nodes: nodes,

        edges: edges

    };


    const options = {

        autoResize: true,

        interaction: {

            dragNodes: true,

            dragView: true,

            zoomView: true

        },

        layout: {

            hierarchical: {

                enabled: true,

                direction: "LR",

                sortMethod: "directed",

                levelSeparation: 180,

                nodeSpacing: 120,

                treeSpacing: 200

            }

        },

        physics: false,

        nodes: {

            shape: "box"

        },

        edges: {

            smooth: {

                type: "cubicBezier",

                forceDirection: "horizontal",

                roundness: 0.4

            }

        }

    };


    // -------------------------------
    // 古いマップを削除
    // -------------------------------

    if (window.ideaNetwork) {

        window.ideaNetwork.destroy();

        window.ideaNetwork = null;

    }


    // -------------------------------
    // マップ作成
    // -------------------------------

    window.ideaNetwork =
        new vis.Network(
            map,
            networkData,
            options
        );


    // -------------------------------
    // 中央に表示
    // -------------------------------

    if (records.length > 0) {

        setTimeout(() => {

            if (window.ideaNetwork) {

                window.ideaNetwork.fit({
                    animation: true
                });

            }

        }, 100);

    }

}


// ========================================
// 画面更新
// ========================================

function updateScreen() {

    updateParentWork();

    showList();

    showMap();

}


// ========================================
// Firebaseからリアルタイム取得
// ========================================

onValue(

    ideasRef,

    snapshot => {

        const data =
            snapshot.val();

        records = [];

        if (data) {

            Object.entries(data).forEach(
                ([key, value]) => {

                    records.push({

                        id: key,

                        workName:
                            value.workName || "",

                        parentWork:
                            value.parentWork || "",

                        idea:
                            value.idea || "",

                        timestamp:
                            value.timestamp || 0

                    });

                }
            );

        }


        // 古い順
        records.sort(
            (a, b) =>
                (a.timestamp || 0) -
                (b.timestamp || 0)
        );


        updateScreen();

    },

    error => {

        console.error(
            "Firebase読み込みエラー:",
            error
        );

        alert(
            "Firebaseからデータを読み込めませんでした。\n" +
            "Realtime Databaseのルールを確認してください。"
        );

    }

);


// ========================================
// 送信
// ========================================

document
    .getElementById("sendBtn")
    .addEventListener(
        "click",
        async () => {

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


            if (workName === "") {

                alert(
                    "作品名を入力してください。"
                );

                return;

            }


            try {

                const newIdeaRef =
                    push(ideasRef);


                await set(
                    newIdeaRef,
                    {

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
                    .value = "";

            }

            catch (error) {

                console.error(
                    "Firebase保存エラー:",
                    error
                );

                alert(
                    "データを保存できませんでした。\n" +
                    error.message
                );

            }

        }
    );


// ========================================
// 全データ削除
// ========================================

document
    .getElementById("clearBtn")
    .addEventListener(
        "click",
        async () => {

            const answer =
                confirm(
                    "Firebaseに保存されている作品データをすべて消しますか？"
                );

            if (!answer) {
                return;
            }


            try {

                await remove(ideasRef);

            }

            catch (error) {

                console.error(
                    "Firebase削除エラー:",
                    error
                );

                alert(
                    "データを削除できませんでした。\n" +
                    error.message
                );

            }

        }
    );