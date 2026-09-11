// ========================================
// アイデアつながりマップ
// 作品 → 作品 のリミックスツリー版
// ========================================


// ----------------------------------------
// 参考にした作品の一覧を更新
// ----------------------------------------
function updateParentWork() {

    const parentWork =
        document.getElementById("parentWork");

    if (!parentWork) {
        return;
    }

    parentWork.innerHTML =
        '<option value="">なし</option>';

    const records =
        JSON.parse(
            localStorage.getItem("ideaMap")
        ) || [];

    records.forEach(data => {

        // 新しいデータ
        let workName = data.workName;

        // 古いデータが残っていた場合の対応
        if (!workName || workName.trim() === "") {
            workName =
                (data.myName || "作品") + "作品";
        }

        const option =
            new Option(
                workName,
                String(data.workId)
            );

        parentWork.appendChild(option);

    });
}


// ----------------------------------------
// マップと一覧を表示
// ----------------------------------------
function showData() {

    const list =
        document.getElementById("list");

    const map =
        document.getElementById("map");

    if (!list || !map) {
        return;
    }

    const records =
        JSON.parse(
            localStorage.getItem("ideaMap")
        ) || [];


    // ====================================
    // 一覧表示
    // ====================================

    list.innerHTML = "";

    records.forEach(data => {

        let workName = data.workName;

        if (!workName || workName.trim() === "") {
            workName =
                (data.myName || "作品") + "作品";
        }

        let parentText = "なし";

        if (
            data.parentWork !== "" &&
            data.parentWork !== null &&
            data.parentWork !== undefined
        ) {

            const parent =
                records.find(
                    r =>
                        String(r.workId) ===
                        String(data.parentWork)
                );

            if (parent) {

                parentText =
                    parent.workName;

                if (
                    !parentText ||
                    parentText.trim() === ""
                ) {
                    parentText =
                        (parent.myName || "作品") +
                        "作品";
                }

            }

        }

        list.innerHTML += `
            <div>
                ${workName}
                ←
                ${parentText}
                （${data.idea || ""}）
            </div>
            <hr>
        `;

    });


    // ====================================
    // ノード作成
    // ====================================

    const nodeData = [];

    records.forEach(data => {

        let workName = data.workName;

        if (!workName || workName.trim() === "") {
            workName =
                (data.myName || "作品") + "作品";
        }

        nodeData.push({

            id: String(data.workId),

            label: workName,

            shape: "box",

            margin: 10,

            font: {
                size: 20
            }

        });

    });


    const nodes =
        new vis.DataSet(nodeData);


    // ====================================
    // 矢印作成
    // ====================================

    const edgeData = [];

    records.forEach(data => {

        if (
            data.parentWork !== "" &&
            data.parentWork !== null &&
            data.parentWork !== undefined
        ) {

            // 参考元の作品が実際に存在するか確認
            const parentExists =
                records.some(
                    r =>
                        String(r.workId) ===
                        String(data.parentWork)
                );

            if (parentExists) {

                edgeData.push({

                    from:
                        String(data.parentWork),

                    to:
                        String(data.workId),

                    arrows: "to",

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


    // ====================================
    // マップ作成
    // ====================================

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


    // 既存のマップがあれば破棄
    if (window.ideaNetwork) {

        window.ideaNetwork.destroy();

    }


    // マップを作る
    window.ideaNetwork =
        new vis.Network(

            map,

            networkData,

            options

        );


    // マップを中央に表示
    if (records.length > 0) {

        setTimeout(() => {

            window.ideaNetwork.fit({

                animation: true

            });

        }, 100);

    }

}


// ----------------------------------------
// 送信ボタン
// ----------------------------------------
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


    // 作品名が空の場合
    if (workName === "") {

        alert("作品名を入力してください。");

        return;

    }


    // 新しい作品データ
    const data = {

        workId:
            Date.now(),

        workName:
            workName,

        parentWork:
            parentWork,

        idea:
            idea

    };


    // 保存済みデータ
    let records =
        JSON.parse(
            localStorage.getItem("ideaMap")
        ) || [];


    // 新しい作品を追加
    records.push(data);


    // 保存
    localStorage.setItem(

        "ideaMap",

        JSON.stringify(records)

    );


    // 入力欄を空にする
    document
    .getElementById("workName")
    .value = "";

    document
    .getElementById("idea")
    .value = "";


    // 画面更新
    showData();

    updateParentWork();

});


// ----------------------------------------
// データを消すボタン
// ----------------------------------------
document
.getElementById("clearBtn")
.addEventListener("click", () => {

    if (
        !confirm(
            "すべてのデータを消しますか？"
        )
    ) {

        return;

    }


    localStorage.removeItem(
        "ideaMap"
    );


    showData();

    updateParentWork();

});


// ----------------------------------------
// 最初に表示
// ----------------------------------------
showData();

updateParentWork();
