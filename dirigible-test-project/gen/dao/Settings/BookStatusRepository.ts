import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface BookStatusEntity {
    readonly Id: number;
    Name: string;
}

export interface BookStatusCreateEntity {
    readonly Name: string;
}

export interface BookStatusUpdateEntity extends BookStatusCreateEntity {
    readonly Id: number;
}

export interface BookStatusEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        contains?: {
            Id?: number;
            Name?: string;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
    },
    $select?: (keyof BookStatusEntity)[],
    $sort?: string | (keyof BookStatusEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BookStatusEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BookStatusEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class BookStatusRepository {

    private static readonly DEFINITION = {
        table: "BOOKSTATUS",
        properties: [
            {
                name: "Id",
                column: "BOOKSTATUS_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "BOOKSTATUS_NAME",
                type: "VARCHAR",
                required: true
            }
        ]
    };

    private readonly dao;

    constructor(dataSource?: string) {
        this.dao = daoApi.create(BookStatusRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BookStatusEntityOptions): BookStatusEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): BookStatusEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: BookStatusCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BOOKSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "BOOKSTATUS_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BookStatusUpdateEntity): void {
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BOOKSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "BOOKSTATUS_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BookStatusCreateEntity | BookStatusUpdateEntity): number {
        const id = (entity as BookStatusUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BookStatusUpdateEntity);
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
            table: "BOOKSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "BOOKSTATUS_ID",
                value: id
            }
        });
    }

    public count(options?: BookStatusEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(options?: BookStatusEntityOptions): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BOOKSTATUS"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BookStatusEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("dirigible-test-project-Settings-BookStatus", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("dirigible-test-project/Settings/BookStatus").send(JSON.stringify(data));
    }
}