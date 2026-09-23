type TableHeaderProps = {
    children: React.ReactNode;
};

export const TableHeader = ({children}: TableHeaderProps) => {
    return (
        <thead>
        <tr>
            {children}
        </tr>
        </thead>
    );
}
