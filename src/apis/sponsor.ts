import httpInstance from './httpInstance'

export interface SponsorPublicItem {
    sponsorId: number
    maskedName: string
    amount: number
    payType: string
    message: string
    sponsorTime: string
    isAnonymous: string
    isMasked?: string
}

export interface SponsorPageResult {
    total: number
    rows: SponsorPublicItem[]
    code: number
    msg: string
}

export const sponsorAPI = {
    /**
     * 分页查询C端公开赞赏流水 (默认 pageNum=1, pageSize=50)
     */
    getList(pageNum: number = 1, pageSize: number = 50) {
        return httpInstance.get<SponsorPageResult>('/sponsor/list', {
            params: { pageNum, pageSize }
        })
    }
}
