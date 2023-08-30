BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"email"	TEXT UNIQUE,
	"name"	TEXT NOT NULL ,
	"role"	TEXT NOT NULL ,
	"salt"	TEXT NOT NULL,
	"password"	TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "pages" (
	"id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"title"	TEXT NOT NULL UNIQUE,
	"slug"	TEXT NOT NULL UNIQUE,
	"authorId"	INTEGER,
	"creation_date"	DATE NOT NULL,
	"publish_date"	DATE,
	CONSTRAINT authorId_fk FOREIGN KEY ("authorId") REFERENCES users ("id")
);

CREATE TABLE IF NOT EXISTS "blocks" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"pageId"	INTEGER,
	"position"  INTEGER,
	"type"	TEXT,
	"content"	TEXT,
	CONSTRAINT pagePosUnique UNIQUE (pageId, position),
	CONSTRAINT pageId_fk FOREIGN KEY (pageId) REFERENCES pages ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "settings" (
	"k"	TEXT PRIMARY KEY,
	"v"	TEXT,
	"userId" INTEGER,
	CONSTRAINT userId_fk FOREIGN KEY ("userId") REFERENCES users ("id")
);

INSERT INTO "users" VALUES (1,'admin@test.com','Gianluca', 'admin', 'admin1234', '182271d14e9562a4736cc526f99e94a002ef7ca263052ec751a6472dd78f60e15409ee3317cd7484fe46d1ba37d296e88b842e5f0bbb44e30004048bb851ec7f' ); /* password='pwd' 64 byte*/
INSERT INTO "users" VALUES (2,'author@test.com','Enrico',  'author', 'author1234', '8b30965f2ded3b2666dc86ed559c8de1ee0985c14eec93eee4a5273ae7373bfb178b72d920e48d3bc27c6862912fb1bcb03bdd47968aa990c37f2c66a709b15e');
INSERT INTO "users" VALUES (3,'alice@test.com','Alice',    'author', 'wgb32sge2sh7hse7', '09a79c91c41073e7372774fcb114b492b2b42f5e948c61d775ad4f628df0e1605e560dc5e7f32ccb914f31dc07fa2124e136372311159949ba4879fad1498250');
INSERT INTO "users" VALUES (4,'harry@test.com','Harry',    'author', 'safd6523tdwt82et', '330f9bd2d0472e3ca8f11d147d01ea210954425a17573d0f6b8240ed503959f8b7d10f8c369e3bc627160c6166c5e3778921a2e6e96ed1bc61879d4d3d4f4c4c');
INSERT INTO "users" VALUES (5,'carol@test.com','Carol',    'author', 'ad37JHUW38wj2833', 'bbbcbac88d988bce98cc13e4c9308306d621d9e278ca62aaee2d156f898a41ddba759f9c3619b9e4672aeb994001b4e5207dc701b7883769bcb15e07ed190611');

INSERT INTO "settings" (k, v, userId) VALUES('title', 'Titolo', 1);

-- published
INSERT INTO pages(id, title, slug, authorId, creation_date, publish_date) 
VALUES(1, 'Lorem ipsum dolor sit amet', 'pagina-1', 3, DATE('2023-06-06'), DATE('2023-06-06') );
INSERT INTO pages(id, title, slug, authorId, creation_date, publish_date) 
VALUES(2, 'Sed felis lacus, luctus vel porta quis, tempor ut erat.', 'pagina-2', 3, DATE('2023-06-06'), DATE('2023-06-06') );

-- blocks
INSERT INTO blocks ( type, pageId, position, content)
VALUES('header', 1, 1, 'Lorem ipsum dolor sit amet - header');
INSERT INTO blocks ( type, pageId, position, content)
VALUES( 'paragrafo', 1, 2, 'Lorem ipsum dolor sit amet - paragrafo');
-- blocks
INSERT INTO blocks ( type, pageId, position, content)
VALUES( 'header', 2, 1, 'Lorem ipsum dolor sit amet - header');
INSERT INTO blocks ( type, pageId, position, content)
VALUES('paragrafo', 2, 2, 'Lorem ipsum dolor sit amet - paragrafo');


-- draft
INSERT INTO pages(id, title, slug, authorId, creation_date, publish_date) 
VALUES(3, 'Suspendisse quis condimentum lectus, ac tristique odio.', 'pagina-3', 3, DATE('2023-06-06'), DATE('') );
INSERT INTO pages(id, title, slug, authorId, creation_date, publish_date) 
VALUES(4, 'Cras pellentesque urna a interdum placerat.', 'pagina-4', 3, DATE('2023-06-09'), DATE('') );

-- blocks
INSERT INTO blocks ( type, pageId, position, content)
VALUES( 'header', 3, 1, 'Lorem ipsum dolor sit amet - header');
INSERT INTO blocks ( type, pageId, position, content)
VALUES('paragrafo', 3, 2, 'Lorem ipsum dolor sit amet - paragrafo');
-- blocks
INSERT INTO blocks ( type, pageId, position, content)
VALUES( 'header', 4, 1, 'Lorem ipsum dolor sit amet - header');
INSERT INTO blocks ( type, pageId, position, content)
VALUES('paragrafo', 4, 2, 'Lorem ipsum dolor sit amet - paragrafo');


-- scheduled
INSERT INTO pages(id, title, slug, authorId, creation_date, publish_date) 
VALUES(5, 'Cras molestie enim justo, id fringilla enim auctor sit amet', 'pagina-5', 3, DATE('2023-06-06'), DATE('2023-12-06') );
INSERT INTO pages(id, title, slug, authorId, creation_date, publish_date) 
VALUES(6, 'Curabitur ornare nibh non ex vehicula, quis mattis urna mollis. Nulla odio tortor, imperdiet vitae viverra sed, facilisis quis augue.', 'pagina-6', 3, DATE('2023-06-06'), DATE('2023-12-06') );

-- blocks
INSERT INTO blocks ( type, pageId, position, content)
VALUES( 'header', 5, 1, 'Lorem ipsum dolor sit amet - header');
INSERT INTO blocks ( type, pageId, position, content)
VALUES( 'paragrafo', 5, 2, 'Lorem ipsum dolor sit amet - paragrafo');
-- blocks
INSERT INTO blocks ( type, pageId, position, content)
VALUES( 'header', 6, 1, 'Lorem ipsum dolor sit amet - header');
INSERT INTO blocks ( type, pageId, position, content)
VALUES( 'paragrafo', 6, 2, 'Lorem ipsum dolor sit amet - paragrafo');


COMMIT;