import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface BookEntity {
    readonly Id: number;
    Title: string;
    Publisher: string;
    Status?: number;
}

export interface BookCreateEntity {
    readonly Title: string;
    readonly Publisher: string;
    readonly Status?: number;
}

export interface BookUpdateEntity extends BookCreateEntity {
    readonly Id: number;
}

export interface BookEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Title?: string | string[];
            Publisher?: string | string[];
            Status?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Title?: string | string[];
            Publisher?: string | string[];
            Status?: number | number[];
        };
        contains?: {
            Id?: number;
            Title?: string;
            Publisher?: string;
            Status?: number;
        };
        greaterThan?: {
            Id?: number;
            Title?: string;
            Publisher?: string;
            Status?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Title?: string;
            Publisher?: string;
            Status?: number;
        };
        lessThan?: {
            Id?: number;
            Title?: string;
            Publisher?: string;
            Status?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Title?: string;
            Publisher?: string;
            Status?: number;
        };
    },
    $select?: (keyof BookEntity)[],
    $sort?: string | (keyof BookEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BookEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BookEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class BookRepository {

    private static readonly DEFINITION = {
        table: "BOOK",
        properties: [
            {
                name: "Id",
                column: "BOOK_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Title",
                column: "BOOK_TITLE",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Publisher",
                column: "BOOK_PUBLISHER",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Status",
                column: "BOOK_STATUS",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource?: string) {
        this.dao = daoApi.create(BookRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BookEntityOptions): BookEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): BookEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: BookCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BOOK",
            entity: entity,
            key: {
                name: "Id",
                column: "BOOK_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BookUpdateEntity): void {
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BOOK",
            entity: entity,
            key: {
                name: "Id",
                column: "BOOK_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BookCreateEntity | BookUpdateEntity): number {
        const id = (entity as BookUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BookUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "BOOK",
            entity: entity,
            key: {
                name: "Id",
                column: "BOOK_ID",
                value: id
            }
        });
    }

    public count(options?: BookEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BOOK"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BookEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("dirigible-test-project-Books-Book", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("dirigible-test-project/Books/Book").send(JSON.stringify(data));
    }
}