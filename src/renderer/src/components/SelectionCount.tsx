
type SelectionCountProps = {
    elementNameSingular: string;
    count: number;
};

export const SelectionCount = ({elementNameSingular, count}: SelectionCountProps) => {
    return (
        <span className="muted">
              {count} {elementNameSingular}{count === 1 ? '' : 's'} selected
        </span>
    );
}
