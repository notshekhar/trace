import { Masthead } from "@/components/masthead/Masthead";

interface Props {
  children: React.ReactNode;
  left?: React.ReactNode;
  aside?: React.ReactNode;
}

/**
 * The single source of truth for page width.
 * Both the masthead and the content use the same container so they
 * stay aligned no matter how many side rails the page has.
 */
function getMaxWidth(left: boolean, aside: boolean): string {
  if (left && aside) return "max-w-[1320px]";
  if (aside || left) return "max-w-[1040px]";
  return "max-w-[680px]";
}

export function PageShell({ children, left, aside }: Props) {
  const hasLeft = !!left;
  const hasAside = !!aside;
  const maxWidth = getMaxWidth(hasLeft, hasAside);

  return (
    <>
      <Masthead maxWidthClassName={maxWidth} />
      <div className={`${maxWidth} mx-auto px-5 pt-10 pb-24`}>
        {hasLeft || hasAside ? (
          <div
            className={
              hasLeft && hasAside
                ? "grid grid-cols-1 lg:grid-cols-[220px_minmax(0,680px)_220px] xl:grid-cols-[240px_minmax(0,680px)_240px] gap-10 xl:gap-16 justify-center"
                : "grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12 lg:gap-16"
            }
          >
            {hasLeft && (
              <aside className="hidden lg:block pt-[72px] order-2 lg:order-1">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 -mr-2 sidebar-scroll">
                  {left}
                </div>
              </aside>
            )}
            <main
              className={`min-w-0 w-full ${
                hasLeft ? "" : "max-w-[680px] mx-auto lg:mx-0"
              } order-1 lg:order-2`}
            >
              {children}
            </main>
            {hasAside && (
              <aside className="hidden lg:block pt-[72px] order-3">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 -mr-2 sidebar-scroll">
                  {aside}
                </div>
              </aside>
            )}
          </div>
        ) : (
          <main>{children}</main>
        )}
      </div>
    </>
  );
}
