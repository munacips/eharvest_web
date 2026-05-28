export const unwrapResponse = <T>(payload: T | { data?: T; content?: T; items?: T; results?: T }): T => {
    if (payload && typeof payload === 'object') {
        const record = payload as { data?: T; content?: T; items?: T; results?: T };
        if (record.data !== undefined) return record.data;
        if (record.content !== undefined) return record.content;
        if (record.items !== undefined) return record.items;
        if (record.results !== undefined) return record.results;
    }

    return payload as T;
};
