import type { ButtonHTMLAttributes } from 'react'

export type IconButtonVariant = 'default' | 'danger'

export interface IconButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string
    variant?: IconButtonVariant
}

export function IconButton({
                               label,
                               variant = 'default',
                               className,
                               title,
                               type = 'button',
                               children,
                               ...props
                           }: IconButtonProps): React.JSX.Element {
    const classes = [
        'icon-button',
        `icon-button--${variant}`,
        className
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <button
            {...props}
            type={type}
            className={classes}
            aria-label={props['aria-label'] ?? label}
            title={title ?? label}
        >
            {children}
        </button>
    )
}