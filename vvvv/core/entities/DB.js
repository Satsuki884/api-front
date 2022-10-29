class User {
    async find_in_db(table, condition) {
        const data = await table.findOne(condition);
        return data;
    }

    async find_all_in_db(table, condition) {
        const data = await table.findAll(condition);
        return data;
    }

    async find_smth_in_db(table, condition) {
        const data = await table.findAndCountAll(condition);
        return data;
    }

    async create_smth(table, info) {
        await table.create(info);
    }
    
    async update_smth(table, info, condition) {
        await table.update(info, condition);
    }

    async delete(table, condition) {
        await table.destroy(condition);
    }
};


export default  User;

