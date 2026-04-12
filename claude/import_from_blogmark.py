# api_techlog/management/commands/import_from_blogmark.py
#
# 使い方:
#   python manage.py import_from_blogmark --user=your@email.com
#   python manage.py import_from_blogmark --user=your@email.com --published-only
#   python manage.py import_from_blogmark --user=your@email.com --dry-run
#

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction


class Command(BaseCommand):
    help = 'blog_mark の記事を api_techlog へ一括移行する'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user', required=True,
            help='投稿者のメールアドレス（api_techlogのauthorに設定）'
        )
        parser.add_argument(
            '--published-only', action='store_true',
            help='公開済み（status=2）の記事のみ移行する'
        )
        parser.add_argument(
            '--dry-run', action='store_true',
            help='DBに保存せずに内容を確認するテスト実行'
        )

    def handle(self, *args, **options):
        from blog_mark.models import Post as OldPost, Category as OldCategory
        from api_techlog.models import Post as NewPost, Category as NewCategory

        User = get_user_model()
        dry_run = options['dry_run']

        # ── 投稿者確認 ───────────────────────────────────────────
        try:
            author = User.objects.get(email=options['user'])
        except User.DoesNotExist:
            raise CommandError(f"ユーザーが見つかりません: {options['user']}")

        self.stdout.write(f'投稿者: {author.email}')
        if dry_run:
            self.stdout.write(self.style.WARNING('【DRY RUN】実際にはDBに保存しません\n'))

        # ── カテゴリ移行 ─────────────────────────────────────────
        self.stdout.write('--- カテゴリ移行 ---')
        cat_map = {}  # { old_category_id: new_Category_instance }

        for old_cat in OldCategory.objects.all().order_by('name'):
            if not dry_run:
                new_cat, created = NewCategory.objects.get_or_create(name=old_cat.name)
            else:
                # dry-run用のダミー（DBには保存しない）
                try:
                    new_cat = NewCategory.objects.get(name=old_cat.name)
                    created = False
                except NewCategory.DoesNotExist:
                    new_cat = NewCategory(name=old_cat.name)  # 未保存
                    created = True

            cat_map[old_cat.id] = new_cat
            mark = self.style.SUCCESS('[新規]') if created else '    [既存]'
            self.stdout.write(f'  {mark} {old_cat.name}')

        self.stdout.write(f'  → 合計 {len(cat_map)} カテゴリ\n')

        # ── 記事移行 ─────────────────────────────────────────────
        self.stdout.write('--- 記事移行 ---')
        qs = OldPost.objects.select_related('category').order_by('created_at')

        if options['published_only']:
            qs = qs.filter(status=2)
            self.stdout.write('  （公開済みのみ対象）')

        total = qs.count()
        self.stdout.write(f'  対象記事数: {total} 件\n')

        ok = 0
        skip_no_content = 0
        skip_no_cat = 0

        with transaction.atomic():
            for i, post in enumerate(qs, 1):

                # ── 本文の組み立て ────────────────────────────────
                # 優先: content（MarkdownxField） → text（旧TextField）
                content = (post.content or '').strip()
                if not content and post.text:
                    content = post.text.strip()

                # codememo があれば末尾にコードブロックとして追記
                if post.codememo and post.codememo.strip():
                    content += (
                        '\n\n## サンプルコード\n\n'
                        f'```\n{post.codememo.strip()}\n```'
                    )

                # 本文が空の場合はスキップ
                if not content:
                    self.stdout.write(
                        self.style.WARNING(f'  SKIP [本文なし]: {post.title}')
                    )
                    skip_no_content += 1
                    continue

                # ── カテゴリ ──────────────────────────────────────
                new_cat = cat_map.get(post.category_id)
                if not new_cat or (not new_cat.pk and not dry_run):
                    self.stdout.write(
                        self.style.WARNING(f'  SKIP [カテゴリなし]: {post.title}')
                    )
                    skip_no_cat += 1
                    continue

                # ── ステータス変換 ────────────────────────────────
                status = 'published' if post.status == 2 else 'draft'

                # ── 保存 ──────────────────────────────────────────
                if not dry_run:
                    NewPost.objects.create(
                        title=post.title,
                        content=content,
                        category=new_cat,
                        author=author,
                        status=status,
                        views=post.views,
                        created_at=post.created_at,
                    )

                ok += 1

                # 50件ごとに進捗表示
                if ok % 50 == 0:
                    self.stdout.write(f'  ... {ok}/{total} 件処理中')

            # dry-run の場合はロールバック
            if dry_run:
                transaction.set_rollback(True)

        # ── 結果サマリー ─────────────────────────────────────────
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✓ 完了'))
        self.stdout.write(f'  移行成功:         {ok} 件')
        self.stdout.write(f'  スキップ(本文なし): {skip_no_content} 件')
        self.stdout.write(f'  スキップ(カテゴリ): {skip_no_cat} 件')
        if dry_run:
            self.stdout.write(self.style.WARNING('\n  ※ DRY RUN のため実際には保存されていません'))
