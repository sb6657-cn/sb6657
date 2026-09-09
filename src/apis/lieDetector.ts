import httpInstance from './httpInstance'

export interface Cs2Team {
    id: number
    name: string
    place: number
    points: number
}

export interface Cs2Player {
    id: number
    teamId: number | null
    teamPlace: number | null
    name: string
    country: string | null
    role: string
    timeOnTeam: string
    mapsPlayed: number
    rating: number | null
    fame: number
}

export interface LieRound {
    playerId: number
    playerName: string
    teamId: number
    teamPlace: number
    factLabel: string
    claim: string
    isTrueStmt: boolean
    fame: number
}

export interface RatingRound {
    playerAId: number
    playerAName: string
    playerBId: number
    playerBName: string
    higherId: number
    ratingA: number
    ratingB: number
}

export interface RatingAnswer {
    correct: boolean
}

export interface LieAnswer {
    known: boolean
    correct: boolean
    player: Cs2Player | null
}

export interface WhoOption {
    id: number
    name: string
    teamPlace: number
}

export interface WhoQuestion {
    playerId: number
    teamId: number
    teamPlace: number
    clues: string[]
    options: WhoOption[]
}

export interface WhoAnswer {
    correct: boolean
    player: Cs2Player | null
}

export interface LieScore {
    userId: number
    score: number
    total: number
    nickName: string
}

export interface LieDialog {
    id: number
    stage: number
    sort: number
    speaker: string
    content: string
    factKey: string
    hint: string
}

export const lieDetectorAPI = {
    getTeams(limit = 20) {
        return httpInstance.get<Cs2Team[]>('/machine/lie/teams', { params: { limit } })
    },
    getPlayers(teamId: number) {
        return httpInstance.get<Cs2Player[]>('/machine/lie/players', { params: { teamId } })
    },
    getRound(teamId = 0, difficulty = 2) {
        return httpInstance.get<LieRound>('/machine/lie/round', { params: { teamId, difficulty } })
    },
    getRatingRound(difficulty = 2) {
        return httpInstance.get<RatingRound>('/machine/lie/ratingRound', { params: { difficulty } })
    },
    submitRatingAnswer(higherId: number, guessId: number, anonymousId?: number) {
        return httpInstance.post<RatingAnswer>('/machine/lie/ratingAnswer', { higherId, guessId, anonId: anonymousId })
    },
    submitAnswer(playerId: number, answeredTrue: boolean, stmtIsTrue: boolean, anonymousId?: number) {
        return httpInstance.post<LieAnswer>('/machine/lie/answer', { playerId, answeredTrue, stmtIsTrue, anonId: anonymousId })
    },
    getWho(teamId = 0, difficulty = 2) {
        return httpInstance.get<WhoQuestion>('/machine/lie/who', { params: { teamId, difficulty } })
    },
    submitWhoAnswer(playerId: number, guessId: number, anonymousId?: number) {
        return httpInstance.post<WhoAnswer>('/machine/lie/whoAnswer', { playerId, guessId, anonId: anonymousId })
    },
    myScore(anonymousId?: number) {
        return httpInstance.get<LieScore>('/machine/lie/score', { params: { anonId: anonymousId } })
    },
    getRank(limit = 100) {
        return httpInstance.get<LieScore[]>('/machine/lie/rank', { params: { limit } })
    },
    getDialogs(stage: number) {
        return httpInstance.get<LieDialog[]>('/machine/lie/dialogs', { params: { stage } })
    },
}