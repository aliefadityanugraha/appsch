// app.js

const data = {
  "762022d1-3631-424b-8b18-983a04e626da": [
    {
      id: "f6234084-2f4e-4651-a4ad-dfb2a0b9baeb",
      nilai: 0.99,
      staffId: "762022d1-3631-424b-8b18-983a04e626da",
      createdAt: "2024-06-22T06:38:44.995Z",
      updatedAt: "2024-06-22T06:38:44.995Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
    {
      id: "78f032f3-b5ef-4fa2-bb77-7ac15d5e4669",
      nilai: 0.585,
      staffId: "762022d1-3631-424b-8b18-983a04e626da",
      createdAt: "2024-07-01T01:52:55.207Z",
      updatedAt: "2024-07-01T01:52:55.207Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
    {
      id: "1221f867-a7b4-424b-8b57-63ec388e3beb",
      nilai: 0.495,
      staffId: "762022d1-3631-424b-8b18-983a04e626da",
      createdAt: "2024-07-01T01:56:02.268Z",
      updatedAt: "2024-07-01T01:56:02.268Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
  ],
  "9630aa9d-2f76-4e63-8589-31c8a16a9618": [
    {
      id: "47af0cfd-fc4d-4db1-9e43-3359b9ab2ea4",
      nilai: 0.45,
      staffId: "9630aa9d-2f76-4e63-8589-31c8a16a9618",
      createdAt: "2024-06-22T06:39:49.111Z",
      updatedAt: "2024-06-22T06:39:49.111Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
    {
      id: "c8621144-d761-41b8-b56b-2ee1c6dedce4",
      nilai: 0.45,
      staffId: "9630aa9d-2f76-4e63-8589-31c8a16a9618",
      createdAt: "2024-07-01T01:52:25.183Z",
      updatedAt: "2024-07-01T01:52:25.183Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
    {
      id: "96ccea96-6921-4e56-8b82-75cb571188f8",
      nilai: 0.45,
      staffId: "9630aa9d-2f76-4e63-8589-31c8a16a9618",
      createdAt: "2024-07-01T05:45:51.550Z",
      updatedAt: "2024-07-01T05:45:51.550Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
  ],
  "f963c590-ea6e-43a3-9ae1-3c793edb9aa5": [
    {
      id: "0cdb65a1-817d-46a0-8530-c5256f031cca",
      nilai: 0.045,
      staffId: "f963c590-ea6e-43a3-9ae1-3c793edb9aa5",
      createdAt: "2024-07-01T02:13:30.964Z",
      updatedAt: "2024-07-01T02:13:30.964Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
  ],
  "58a5334e-b38f-4ae2-81a4-0fb8bbcdcf7e": [
    {
      id: "b9173847-795a-4fd6-8387-04588b74e8d1",
      nilai: 0.225,
      staffId: "58a5334e-b38f-4ae2-81a4-0fb8bbcdcf7e",
      createdAt: "2024-07-01T04:57:12.423Z",
      updatedAt: "2024-07-01T04:57:12.423Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
    {
      id: "ee1fa864-04bd-4ee8-b414-cb30bed4d156",
      nilai: 0.225,
      staffId: "58a5334e-b38f-4ae2-81a4-0fb8bbcdcf7e",
      createdAt: "2024-07-01T05:00:28.850Z",
      updatedAt: "2024-07-01T05:00:28.850Z",
      data: [{ index: 1 }, { index: 2 }, { index: 3 }],
    },
  ],
};

const data2 = {
  "8ad6a7b0-9d2e-46eb-a561-d75a14ad1eb3": [
    {
      id: "02c5c41d-64d2-4936-9915-3de98b885f43",
      nilai: 2.475,
      createdAt: "2024-07-03T16:38:50.421Z",
      updatedAt: "2024-07-03T16:38:50.421Z",
    },
    {
      id: "f97d30eb-e77b-41fb-8137-1660e8004268",
      nilai: 2.475,
      createdAt: "2024-07-03T16:39:40.597Z",
      updatedAt: "2024-07-03T16:39:40.597Z",
    },
    {
      id: "03a04ce7-81e0-4497-a329-683aa55bc2e7",
      nilai: 2.925,
      createdAt: "2024-07-04T02:49:42.056Z",
      updatedAt: "2024-07-04T02:49:42.056Z",
    },
    {
      id: "5c7d62c5-7b64-478a-8cb8-0febe78d02fe",
      nilai: 0.3150000000000001,
      createdAt: "2024-07-04T04:01:48.515Z",
      updatedAt: "2024-07-04T04:01:48.515Z",
    },
    {
      id: "f3e9f5f6-560e-4a7b-861f-f4b9999a4d61",
      nilai: 0.045,
      createdAt: "2024-07-04T04:04:21.093Z",
      updatedAt: "2024-07-04T04:04:21.093Z",
    },
  ],
};
// New object to accumulate the data
let newObj = {};

for (const staffId in data) {
  newObj[staffId] = data[staffId].map((record) => ({
    id: record.id,
    nilai: record.nilai,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    data: record.data.map((item) => item.index),
  }));
}

console.log(JSON.stringify(newObj, null, 2));
