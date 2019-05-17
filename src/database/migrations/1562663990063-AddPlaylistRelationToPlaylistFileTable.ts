import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddPlaylistRelationToPlaylistFileTable1562663990063 implements MigrationInterface {

    private tableForeignKey = new TableForeignKey({
        name: 'fk_playlist_playlistfile',
        columnNames: ['playlist_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'playlist',
        onDelete: 'CASCADE',
    });

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createForeignKey('playlist_file', this.tableForeignKey);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropForeignKey('playlist_file', this.tableForeignKey);
    }

}
