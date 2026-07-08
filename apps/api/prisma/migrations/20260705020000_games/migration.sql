-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "quiz_id" TEXT,
    "host_id" TEXT NOT NULL,
    "quiz_title" TEXT NOT NULL,
    "question_count" INTEGER NOT NULL,
    "player_count" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_players" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL,

    CONSTRAINT "game_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_responses" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "question_index" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "points" INTEGER NOT NULL,
    "response_ms" INTEGER NOT NULL,

    CONSTRAINT "game_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "games_host_id_idx" ON "games"("host_id");

-- CreateIndex
CREATE INDEX "games_quiz_id_idx" ON "games"("quiz_id");

-- CreateIndex
CREATE INDEX "game_players_game_id_idx" ON "game_players"("game_id");

-- CreateIndex
CREATE INDEX "game_responses_game_id_question_index_idx" ON "game_responses"("game_id", "question_index");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_responses" ADD CONSTRAINT "game_responses_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
