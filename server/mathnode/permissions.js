// Named user permission types
const types = {
    none: -1,
    // 0 & 1 Not in use
    banned: 2,
    guest: 3,
    unverified: 4,
    member: 5,
    self: 6, // Logged in member
    // 7 Reserverd for future uses
    moderator: 8,
    // 9 Reserved for future uses
    admin: 10,
}

const actions = {
    modify: {
        users: {
            name:       [types.self, types.moderator, types.admin],
            email:      [types.self, types.moderator, types.admin],
            password:   [types.self, types.moderator, types.admin],
            verified:   [types.moderator, types.admin],
            banned:     [types.moderator, types.admin],
            type:       [types.admin],
            last_login: [types.admin],
            credentials:types.none,
            id:         types.none
        },
        packages: {
            id:         types.none,
            url:        types.none,
            name:       [types.self, types.moderator, types.admin],
            status:     [types.self, types.moderator, types.admin],
            expression: [types.self, types.moderator, types.admin],
            save_date:  types.none,
            user_id:    types.none,
            edit_date:  [types.self, types.moderator, types.admin],
        },
        layouts: {
            id:         types.none,
            name:       [types.self, types.moderator, types.admin],
            categories: [types.self, types.moderator, types.admin],
        },
    },
    read: {
        users: {
            name:       [types.guest, types.unverified, types.self, types.moderator, types.admin],
            type:       [types.guest, types.unverified, types.self, types.moderator, types.admin],
            verified:   [types.guest, types.unverified, types.self, types.moderator, types.admin],
            banned:     [types.guest, types.unverified, types.self, types.moderator, types.admin],
            last_login: [types.guest, types.unverified, types.self, types.moderator, types.admin],
            email:      [types.self, types.moderator, types.admin],
            password:   [types.self, types.moderator, types.admin],
            credentials:types.none,
            id:         types.guest
        }
    },
    remove: {
        users:      [types.admin],
        packages:   [types.admin, types.moderator, types.self],
        layouts:    [types.admin, types.moderator, types.self],
    },
    create: {
        packages:   [types.admin, types.moderator, types.self],
        layouts:    [types.admin, types.moderator, types.self],
    }
};

module.exports = {
    types: types,
    actions: actions
};
