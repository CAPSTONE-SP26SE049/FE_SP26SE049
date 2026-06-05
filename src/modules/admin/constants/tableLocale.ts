import type { TableProps } from 'antd'

/** Locale thống nhất cho bảng Admin — tránh chữ "No data" mặc định tiếng Anh. */
export const ADMIN_TABLE_LOCALE: TableProps['locale'] = {
    emptyText: 'Không có dữ liệu',
}
