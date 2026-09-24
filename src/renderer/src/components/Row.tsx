type RowProps = {
    children: React.ReactNode;
};

export const Row = ({children}: RowProps) => {
    return (
        <div className="filter-row">
            {children}
        </div>
    )
}
