# MongoDB 핵심 개념 정리

> 이 문서는 MAM 프로젝트를 기준으로 MongoDB + Mongoose 를 처음 배우는 사람을 위한 학습 자료입니다.

---

## 목차

1. [MongoDB가 뭔가?](#1-mongodb가-뭔가)
2. [관계형 DB vs MongoDB 비교](#2-관계형-db-vs-mongodb-비교)
3. [핵심 용어](#3-핵심-용어)
4. [MongoDB 시작하기](#4-mongodb-시작하기)
5. [기본 CRUD](#5-기본-crud)
6. [자주 쓰는 쿼리 메서드](#6-자주-쓰는-쿼리-메서드)
7. [Mongoose란?](#7-mongoose란)
8. [Mongoose Schema & Model](#8-mongoose-schema--model)
9. [Mongoose에서 CRUD](#9-mongoose에서-crud)
10. [페이지네이션 패턴](#10-페이지네이션-패턴)
11. [인덱스(Index)](#11-인덱스index)
12. [이 프로젝트에서 쓰인 패턴 정리](#12-이-프로젝트에서-쓰인-패턴-정리)

---

## 1. MongoDB가 뭔가?

MongoDB는 **문서 지향(Document-Oriented) 데이터베이스**입니다.

데이터를 **JSON과 유사한 형태(BSON)** 로 저장합니다.

```json
{
  "_id": "665abc123...",
  "title": "MongoDB 공부",
  "content": "오늘은 MongoDB를 배웠다",
  "date": "2025-01-01",
  "slug": "mongodb-study"
}
```

테이블과 행 대신 **컬렉션(Collection)** 과 **문서(Document)** 라는 개념을 씁니다.

---

## 2. 관계형 DB vs MongoDB 비교

| 개념 | MySQL (관계형) | MongoDB |
|------|---------------|---------|
| 저장 단위 | 행 (Row) | 문서 (Document) |
| 묶음 단위 | 테이블 (Table) | 컬렉션 (Collection) |
| DB 전체 | 데이터베이스 | 데이터베이스 |
| 스키마 | 고정 (미리 정의) | 유연 (없어도 됨) |
| 관계 표현 | JOIN | 중첩 문서 or 참조 |
| 쿼리 언어 | SQL | MongoDB Query Language |

**MySQL 예시:**
```sql
SELECT * FROM posts WHERE category = 'study' ORDER BY date DESC LIMIT 7;
```

**MongoDB 예시:**
```js
db.posts.find({ category: 'study' }).sort({ date: -1 }).limit(7)
```

---

## 3. 핵심 용어

### Document (문서)
MongoDB에 저장되는 데이터 하나. JSON 객체와 동일하게 생겼습니다.

```json
{
  "_id": "ObjectId('665abc...')",
  "title": "첫 번째 글",
  "category": "study"
}
```

### Collection (컬렉션)
Document들의 묶음. MySQL의 테이블과 같습니다.

```
posts 컬렉션
├── { _id: ..., title: "글1", ... }
├── { _id: ..., title: "글2", ... }
└── { _id: ..., title: "글3", ... }
```

### _id
MongoDB가 모든 문서에 **자동으로 부여하는 고유 식별자**입니다.
직접 지정하지 않으면 `ObjectId` 타입으로 자동 생성됩니다.

```js
_id: ObjectId('665abc1234567890abcdef12')
//   ↑ 12바이트 = 타임스탬프 + 머신ID + 랜덤값
//     → 전 세계에서 고유하게 생성됨
```

### BSON
Binary JSON. MongoDB 내부 저장 형식입니다. 개발자 입장에서는 JSON이라고 생각해도 무방합니다.

---

## 4. MongoDB 시작하기

### 4-1. 설치 (Ubuntu 기준)

```bash
# MongoDB 공식 저장소 추가
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

# 시작
sudo systemctl start mongod
sudo systemctl enable mongod  # 부팅 시 자동 시작
```

### 4-2. Docker로 시작 (더 쉬운 방법)

```yaml
# docker-compose.yml
services:
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - ./mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
```

```bash
docker compose up -d
```

### 4-3. 접속

```bash
# MongoDB Shell (mongosh)
mongosh

# URI로 접속
mongosh "mongodb://localhost:27017"

# 인증 포함
mongosh "mongodb://admin:password@localhost:27017"
```

### 4-4. Shell 기본 명령어

```js
show dbs              // 데이터베이스 목록
use myDatabase        // 데이터베이스 선택 (없으면 자동 생성)
show collections      // 현재 DB의 컬렉션 목록
db                    // 현재 사용 중인 DB 이름 확인
```

### 4-5. .env 설정

Node.js 프로젝트에서 MongoDB에 연결할 때:

```env
# .env.local
MONGO_URI=mongodb://localhost:27017/myDatabase

# Atlas(클라우드) 사용 시
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/myDatabase
```

---

## 5. 기본 CRUD

MongoDB Shell에서 직접 실행하는 명령어입니다.

### Create (삽입)

```js
// 하나 삽입
db.posts.insertOne({
  title: "첫 글",
  content: "내용",
  category: "study",
  date: new Date()
})

// 여러 개 삽입
db.posts.insertMany([
  { title: "글1", category: "hobby" },
  { title: "글2", category: "study" }
])
```

### Read (조회)

```js
// 전체 조회
db.posts.find()

// 조건 조회 (category가 'study'인 것만)
db.posts.find({ category: "study" })

// 하나만 조회
db.posts.findOne({ title: "첫 글" })

// 특정 필드만 가져오기 (1: 포함, 0: 제외)
db.posts.find({}, { title: 1, date: 1, _id: 0 })
```

### Update (수정)

```js
// 하나 수정
db.posts.updateOne(
  { title: "첫 글" },           // 찾을 조건
  { $set: { title: "수정된 글" } } // 바꿀 내용
)

// 여러 개 수정
db.posts.updateMany(
  { category: "hobby" },
  { $set: { category: "취미" } }
)
```

### Delete (삭제)

```js
// 하나 삭제
db.posts.deleteOne({ title: "첫 글" })

// 여러 개 삭제
db.posts.deleteMany({ category: "hobby" })

// 전체 삭제 (주의!)
db.posts.deleteMany({})
```

---

## 6. 자주 쓰는 쿼리 메서드

### 정렬 — `.sort()`

```js
// 최신순 (date 내림차순)
db.posts.find().sort({ date: -1 })

// 오래된 순 (date 오름차순)
db.posts.find().sort({ date: 1 })

// 여러 기준으로 정렬 (category 오름차순, 그 안에서 date 내림차순)
db.posts.find().sort({ category: 1, date: -1 })
```

### 개수 제한 — `.limit()`

```js
// 최신 5개만
db.posts.find().sort({ date: -1 }).limit(5)
```

### 건너뛰기 — `.skip()`

```js
// 앞 7개 건너뛰고 그 다음부터
db.posts.find().sort({ date: -1 }).skip(7)
```

### 개수 세기 — `.countDocuments()`

```js
// 전체 개수
db.posts.countDocuments()

// 조건에 맞는 개수
db.posts.countDocuments({ category: "study" })
```

### 비교 연산자

```js
// 크다/작다
db.posts.find({ views: { $gt: 100 } })   // views > 100
db.posts.find({ views: { $gte: 100 } })  // views >= 100
db.posts.find({ views: { $lt: 100 } })   // views < 100
db.posts.find({ views: { $lte: 100 } })  // views <= 100
db.posts.find({ views: { $ne: 0 } })     // views != 0

// 배열 안에 포함 여부
db.posts.find({ category: { $in: ["study", "hobby"] } })
```

### 정규식 검색

```js
// title에 "MongoDB"가 포함된 문서 (대소문자 무시)
db.posts.find({ title: { $regex: "MongoDB", $options: "i" } })
```

---

## 7. Mongoose란?

**Mongoose**는 Node.js에서 MongoDB를 쉽게 쓰기 위한 라이브러리(ODM)입니다.

> ODM = Object Document Mapper
> 문서(Document)를 JavaScript 객체로 매핑해주는 도구

MongoDB 자체는 스키마(구조)가 없어서 아무 형태나 넣을 수 있습니다.
Mongoose를 쓰면 **TypeScript 타입처럼 구조를 미리 정의**하고, 유효성 검사도 자동으로 됩니다.

```
MongoDB만 쓸 때        Mongoose를 쓸 때
─────────────────     ─────────────────────────────
아무 구조나 삽입 가능   Schema로 구조 강제
_id 관리 직접          _id 자동 관리
검증 없음              required, unique 등 자동 검증
```

### 설치

```bash
npm install mongoose
```

---

## 8. Mongoose Schema & Model

### Schema — 구조 정의

```ts
import mongoose, { Schema } from 'mongoose';

const postsSchema = new Schema({
  title:    { type: String, required: true },        // 필수
  content:  { type: String, required: true },        // 필수
  category: { type: String, required: true },        // 필수
  date:     { type: Date,   default: Date.now },     // 기본값
  slug:     { type: String, required: true, unique: true }, // 필수 + 중복 불가
});
```

| 옵션 | 설명 |
|------|------|
| `required: true` | 이 필드 없으면 저장 거부 |
| `unique: true` | 중복 값 허용 안 함 (자동 인덱스 생성) |
| `default: value` | 값이 없을 때 자동으로 넣을 기본값 |
| `min / max` | 숫자 최솟값/최댓값 제한 |
| `minlength / maxlength` | 문자열 길이 제한 |

### Model — Schema로 만든 클래스

```ts
const ModelPostsSetting = mongoose.models.posts
  ?? mongoose.model('posts', postsSchema);
//                   ↑ 컬렉션 이름 (MongoDB에서 자동으로 's' 붙여서 'posts'로 저장됨)

export default ModelPostsSetting;
```

`mongoose.models.posts ?? mongoose.model(...)` 패턴은
Next.js에서 **핫 리로드 시 모델이 중복 등록되는 오류를 방지**하기 위한 관용구입니다.

---

## 9. Mongoose에서 CRUD

### 연결 (Connection)

```ts
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI!);
```

### Create (생성)

```ts
// 방법 1: new + save()
const post = new ModelPostsSetting({
  title: '새 글',
  content: '내용',
  category: 'study',
  slug: 'new-post',
});
await post.save();

// 방법 2: create() — 한 줄로
await ModelPostsSetting.create({
  title: '새 글',
  content: '내용',
  category: 'study',
  slug: 'new-post',
});
```

### Read (조회)

```ts
// 전체 조회
const posts = await ModelPostsSetting.find({});

// 조건 조회
const studyPosts = await ModelPostsSetting.find({ category: 'study' });

// _id로 하나 조회
const post = await ModelPostsSetting.findById('665abc123...');

// 조건으로 하나 조회
const post = await ModelPostsSetting.findOne({ slug: 'my-post' });

// lean() → Mongoose 객체가 아닌 순수 JS 객체로 반환 (빠름, JSON 직렬화 안전)
const posts = await ModelPostsSetting.find({}).lean();
```

### Update (수정)

```ts
// _id로 찾아서 수정
await ModelPostsSetting.findByIdAndUpdate(
  '665abc123...',        // 찾을 _id
  { title: '수정된 제목' }, // 바꿀 내용
  { new: true }          // 수정 후 문서를 반환 (없으면 수정 전 문서 반환)
);

// 조건으로 찾아서 수정
await ModelPostsSetting.findOneAndUpdate(
  { slug: 'my-post' },
  { $set: { title: '수정됨' } },
  { new: true }
);
```

### Delete (삭제)

```ts
// _id로 찾아서 삭제
await ModelPostsSetting.findByIdAndDelete('665abc123...');

// 조건으로 하나 삭제
await ModelPostsSetting.findOneAndDelete({ slug: 'my-post' });

// 조건에 맞는 전부 삭제
await ModelPostsSetting.deleteMany({ category: 'hobby' });
```

---

## 10. 페이지네이션 패턴

이 프로젝트에서 구현한 서버 사이드 페이지네이션입니다.

```ts
async function getPosts(page: number = 1, limit: number = 7) {
  // 1. 전체 개수 (페이지 수 계산용)
  const total = await ModelPostsSetting.countDocuments({});

  // 2. 해당 페이지 데이터만
  const posts = await ModelPostsSetting
    .find({})
    .sort({ date: -1 })        // 최신순
    .skip((page - 1) * limit)  // 앞 페이지 건너뜀
    .limit(limit)              // 이번 페이지 개수만큼만
    .lean();

  // 3. 총 페이지 수 계산
  const totalPages = Math.ceil(total / limit);

  return { posts, total, totalPages };
}

// 사용 예시
const page1 = await getPosts(1, 7);  // 1~7번 글
const page2 = await getPosts(2, 7);  // 8~14번 글
const page3 = await getPosts(3, 7);  // 15~21번 글
```

**skip/limit 시각화:**

```
전체 글 (최신순 정렬됨)
[1][2][3][4][5][6][7] | [8][9][10][11][12][13][14] | [15]...

page=1: skip(0),  limit(7) → [1][2][3][4][5][6][7]
page=2: skip(7),  limit(7) → [8][9][10][11][12][13][14]
page=3: skip(14), limit(7) → [15]...
```

---

## 11. 인덱스(Index)

인덱스는 **빠른 검색을 위한 색인**입니다.
책의 목차처럼, 원하는 데이터를 빠르게 찾을 수 있게 해줍니다.

### 인덱스 없을 때 vs 있을 때

```
인덱스 없음: { slug: 'my-post' } 검색
→ 전체 문서를 하나씩 순서대로 확인 (Collection Scan)
→ 문서가 100만 개면 100만 번 확인

인덱스 있음: { slug: 'my-post' } 검색
→ B-Tree 인덱스에서 바로 위치 찾기
→ 문서가 100만 개여도 몇 번 확인으로 끝
```

### Mongoose에서 인덱스 설정

```ts
const postsSchema = new Schema({
  slug: { type: String, unique: true },  // unique: true → 자동으로 인덱스 생성
  date: { type: Date },
});

// 명시적 인덱스 추가
postsSchema.index({ date: -1 });         // date 내림차순 인덱스
postsSchema.index({ category: 1, date: -1 }); // 복합 인덱스
```

### 언제 인덱스를 추가해야 하는가?

| 상황 | 인덱스 추가 |
|------|------------|
| 자주 검색하는 필드 | O |
| `.sort()` 자주 쓰는 필드 | O |
| `unique: true` 필드 | 자동 생성 |
| 자주 변경되는 필드 | 신중히 (쓰기 속도 저하) |
| 모든 필드 | X (저장 공간 낭비) |

---

## 12. 이 프로젝트에서 쓰인 패턴 정리

### 연결 싱글톤 패턴 (ConnectMongoDB.ts)

```ts
// 이미 연결돼 있으면 재사용, 없으면 새로 연결
let cached = global.mongoose;
if (!cached.conn) {
  cached.conn = await mongoose.connect(MONGO_URI);
}
return cached.conn;
```

Next.js는 서버리스 환경이라 요청마다 새 연결을 만들 수 있습니다.
연결을 캐싱해서 **연결 낭비를 방지**합니다.

### lean() 사용 이유

```ts
const posts = await Model.find({}).lean();
//                                 ↑ 필수
// Next.js: 서버 → 클라이언트로 데이터 전달 시
// Mongoose Document 객체는 직렬화 불가 → lean()으로 순수 객체로 변환
```

### _id 문자열 변환

```ts
return {
  ...p,
  _id: p._id.toString(),  // ObjectId → string
};
```

MongoDB의 `_id`는 `ObjectId` 타입입니다.
JSON으로 직렬화하거나 React 컴포넌트에 prop으로 넘길 때 **string으로 변환**이 필요합니다.

### 빌드 타임 안전 처리

```ts
if (!process.env.MONGO_URI) return { posts: [], total: 0 };
```

Next.js 빌드 시에는 DB 연결이 없습니다.
`MONGO_URI`가 없으면 빈 값 반환으로 **빌드 오류를 방지**합니다.

---

## 자주 헷갈리는 것들

| 헷갈리는 점 | 정답 |
|------------|------|
| `find()` vs `findOne()` | `find()`는 배열 반환, `findOne()`은 객체 하나 반환 |
| `_id`가 왜 문자열이 아닌가? | MongoDB 내부에서 `ObjectId` 타입으로 저장됨, `.toString()` 필요 |
| `lean()` 없으면? | Mongoose Document 객체 반환 → JSON 직렬화 시 문제 |
| `{ new: true }` 없으면? | `findByIdAndUpdate`가 수정 **전** 문서를 반환 |
| 왜 두 번 쿼리 하는가? | `countDocuments` + `find` → MongoDB는 개수+내용 동시 반환 기능 없음 |
| `skip` 성능 문제? | 데이터가 매우 많을 때(수백만 건) skip이 느릴 수 있음 → 커서 기반 페이지네이션으로 개선 가능 |

---

## 참고 자료

- [MongoDB 공식 문서](https://www.mongodb.com/docs/)
- [Mongoose 공식 문서](https://mongoosejs.com/docs/)
- [MongoDB University (무료 강좌)](https://learn.mongodb.com/)
