import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

interface FeedLayoutProps {
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  children: React.ReactNode;
}

export default function FeedLayout({ user, children }: FeedLayoutProps) {
  return (
    <div className="_layout _layout_main_wrapper">
      <div className="_main_layout">
        <Navbar user={user} />
        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <LeftSidebar />
              </div>
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    {children}
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <RightSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
