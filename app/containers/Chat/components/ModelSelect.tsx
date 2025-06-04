import Popover from "@/app/components/Popover";
import { useMemo, useRef, useState } from "react";
import useRelativePosition, {
  Orientation,
} from "@/app/hooks/useRelativePosition";
import Locale from "@/app/locales";
import { useChatStore } from "@/app/store/chat";
import { useAllModels } from "@/app/utils/hooks";
import { ModelType, useAppConfig } from "@/app/store/config";
import { showToast } from "@/app/components/ui-lib";
import BottomArrow from "@/app/icons/downArrowLgIcon.svg";
import BottomArrowMobile from "@/app/icons/bottomArrow.svg";
import Modal, { TriggerProps } from "@/app/components/Modal";

const ModelSelect = () => {
  const config = useAppConfig();
  const { isMobileScreen } = config;
  const chatStore = useChatStore();
  const currentModel = chatStore.currentSession().mask.modelConfig.model;
  const allModels = useAllModels();
  const [searchTerm, setSearchTerm] = useState("");

  const models = useMemo(() => {
    const filteredModels = allModels.filter((m) => m.available);
    const defaultModel = filteredModels.find((m) => m.isDefault);

    if (defaultModel) {
      const arr = [
        defaultModel,
        ...filteredModels.filter((m) => m !== defaultModel),
      ];
      return arr;
    } else {
      return filteredModels;
    }
  }, [allModels]);

  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return models;
    return models.filter(
      (model) =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.displayName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [models, searchTerm]);

  const rootRef = useRef<HTMLDivElement>(null);

  const { position, getRelativePosition } = useRelativePosition({
    delay: 0,
  });

  const contentRef = useMemo<{ current: HTMLDivElement | null }>(() => {
    return {
      current: null,
    };
  }, []);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const autoScrollToSelectedModal = () => {
    window.setTimeout(() => {
      const distanceToParent = selectedItemRef.current?.offsetTop || 0;
      const childHeight = selectedItemRef.current?.offsetHeight || 0;
      const parentHeight = contentRef.current?.offsetHeight || 0;
      const distanceToParentCenter =
        distanceToParent + childHeight / 2 - parentHeight / 2;

      if (distanceToParentCenter > 0 && contentRef.current) {
        contentRef.current.scrollTop = distanceToParentCenter;
      }
    });
  };

  const content: TriggerProps["content"] = ({ close }) => (
    <div
      className={`flex flex-col gap-1 overflow-x-hidden  relative text-sm-title`}
    >
      <div
        className="px-3 py-2 border-b border-gray-200 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>
      {filteredModels?.map((o) => (
        <div
          key={o.displayName}
          className={`flex  items-center px-3 py-2 gap-3 rounded-action-btn hover:bg-select-option-hovered  cursor-pointer`}
          onClick={() => {
            chatStore.updateCurrentSession((session) => {
              session.mask.modelConfig.model = o.name as ModelType;
              session.mask.syncGlobalConfig = false;
            });
            showToast(o.name);
          }}
          ref={currentModel === o.name ? selectedItemRef : undefined}
        >
          <div className={`flex-1 text-text-select`}>{o.displayName}</div>
        </div>
      ))}
      {filteredModels?.length === 0 && searchTerm.trim() && (
        <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          No models found matching {`"${searchTerm}"`}
        </div>
      )}
    </div>
  );

  if (isMobileScreen) {
    return (
      <Modal.Trigger
        content={(e) => (
          <div className="h-[100%]  overflow-y-auto" ref={contentRef}>
            {content(e)}
          </div>
        )}
        type="bottom-drawer"
        onOpen={(e) => {
          if (e) {
            autoScrollToSelectedModal();
            getRelativePosition(rootRef.current!, "");
          }
        }}
        title={Locale.Chat.SelectModel}
        headerBordered
        noFooter
        modelClassName="h-model-bottom-drawer"
      >
        <div
          className="flex items-center gap-1 cursor-pointer text-text-modal-select"
          ref={rootRef}
        >
          {currentModel}
          <BottomArrowMobile />
        </div>
      </Modal.Trigger>
    );
  }

  return (
    <Popover
      content={
        <div className="max-h-chat-actions-select-model-popover overflow-y-auto">
          {content({ close: () => {} })}
        </div>
      }
      trigger="click"
      noArrow
      placement={
        position?.poi.relativePosition[1] !== Orientation.bottom ? "lb" : "lt"
      }
      popoverClassName="border border-select-popover rounded-lg shadow-select-popover-shadow w-actions-popover  bg-model-select-popover-panel w-[280px]"
      onShow={(e) => {
        if (e) {
          autoScrollToSelectedModal();
          getRelativePosition(rootRef.current!, "");
        }
      }}
      getPopoverPanelRef={(ref) => (contentRef.current = ref.current)}
    >
      <div
        className="flex items-center justify-center gap-1 cursor-pointer rounded-chat-model-select pl-3 pr-2.5 py-2 font-common leading-4 bg-chat-actions-select-model hover:bg-chat-actions-select-model-hover"
        ref={rootRef}
      >
        <div className="line-clamp-1 max-w-chat-actions-select-model text-sm-title text-text-modal-select">
          {currentModel}
        </div>
        <BottomArrow />
      </div>
    </Popover>
  );
};

export default ModelSelect;
