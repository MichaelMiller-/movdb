type TableColumnProps = {
    name: string
}

export const TableColumn = ({name, ...props}: TableColumnProps) => {
    return (<th {...props} >{name}</th>);
}
