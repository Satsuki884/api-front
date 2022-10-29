import { DataTypes, Sequelize } from"sequelize";
import { sequelize }from'./admindb.js';

const users = sequelize.define('users', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    login: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING(240),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
    },
    role: {
        type: Sequelize.ENUM("user", "admin"),
        allowNull: false,
        defaultValue: "user",
    },
    profile_image: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "../../ui/resources/profile_images/default.jpg",
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }
}, {
    timestamps: false
});

const posts = sequelize.define('posts', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    author: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    publishDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    status: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
}, {
    timestamps: false
});

const categories = sequelize.define('categories',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
}, {
    timestamps: false
});

const post_category = sequelize.define('post_category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    init_post: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'posts',
            key: 'id'
        }
    },
    init_category: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id'
        }
    }
}, {
    timestamps: false
});

const comments = sequelize.define('comments', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    init_post: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'posts',
            key: 'id'
        }
    },
    publishDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false
    }
}, {
    timestamps: false
});

const like_post = sequelize.define('like_post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    init_post: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'posts',
            key: 'id'
        }
    },
    publishDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    type: {
        type: Sequelize.ENUM("like", "dislike"),
        allowNull: false
    },
}, {
    timestamps: false
});

const commentsLikes = sequelize.define('like_comments', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    init_comment: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'comments',
            key: 'id'
        }
    },
    publishDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    type: {
        type: Sequelize.ENUM("like", "dislike")
    },
}, {
    timestamps: false
});

sequelize.sync().then(() => {
    console.log('\n----------------------------\nTable created successfully!');
}).catch((error) => {
    console.error('\n----------------------------\nUnable to create such table : ', error);
});

export   { users, posts, categories, post_category, comments, commentsLikes, like_post };

