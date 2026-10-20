"use client";

import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { createAvatar, type AvatarController } from "@bible-strong/avatar-react";
import "@bible-strong/avatar-react/styles.css";
import kirbyDefinition from "./kirby.avatar.json";

export const BaseAvatar = createAvatar(kirbyDefinition);

export type AvatarAnimation = keyof typeof kirbyDefinition.animations;
export type AvatarExpression = keyof typeof kirbyDefinition.expressions;

export interface AvatarMascotHandle {
  play: (animation: AvatarAnimation) => void;
  setExpression: (expression: AvatarExpression) => void;
  pause: () => void;
  stop: () => void;
  getController: () => AvatarController | null;
}

export interface AvatarMascotProps {
  mode?: "ambient" | "chat" | "login" | "celebrate" | "not-found" | "custom";
  animation?: AvatarAnimation;
  expression?: AvatarExpression | null;
  chatState?: "idle" | "listening" | "thinking" | "speaking" | "error";
  isPasswordActive?: boolean;
  showPassword?: boolean;
  size?: number | string;
  className?: string;
  interactive?: boolean;
  speechBubble?: string | null;
  onCelebrationDone?: () => void;
  onClick?: () => void;
}

export const AvatarMascot = forwardRef<AvatarMascotHandle, AvatarMascotProps>(
  function AvatarMascot(
    {
      mode = "ambient",
      animation: externalAnimation,
      expression: externalExpression = null,
      chatState = "idle",
      isPasswordActive = false,
      showPassword = false,
      size = 105,
      className = "",
      interactive = true,
      speechBubble = null,
      onCelebrationDone,
      onClick,
    },
    ref
  ) {
    const avatarRef = useRef<AvatarController>(null);
    const [internalAnimation, setInternalAnimation] = useState<AvatarAnimation>("idle");
    const [internalExpression, setInternalExpression] = useState<AvatarExpression | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        play: (anim: AvatarAnimation) => {
          setInternalExpression(null);
          setInternalAnimation(anim);
          avatarRef.current?.play(anim as string);
        },
        setExpression: (expr: AvatarExpression) => {
          setInternalAnimation("idle");
          setInternalExpression(expr);
          avatarRef.current?.setExpression(expr as string);
        },
        pause: () => avatarRef.current?.pause(),
        stop: () => avatarRef.current?.stop(),
        getController: () => avatarRef.current,
      }),
      []
    );

    // 1. External override if provided
    useEffect(() => {
      if (externalAnimation) {
        setInternalAnimation(externalAnimation);
        setInternalExpression(null);
      }
    }, [externalAnimation]);

    useEffect(() => {
      if (externalExpression !== undefined) {
        setInternalExpression(externalExpression);
      }
    }, [externalExpression]);

    // 2. Chat mode mapping
    useEffect(() => {
      if (mode !== "chat") return;
      if (chatState === "listening") {
        setInternalAnimation("listening");
        setInternalExpression(null);
      } else if (chatState === "thinking") {
        setInternalAnimation("thinking");
        setInternalExpression(null);
      } else if (chatState === "speaking") {
        setInternalAnimation("happy");
        setInternalExpression(null);
      } else if (chatState === "error") {
        setInternalAnimation("confused");
        setInternalExpression(null);
      } else {
        setInternalAnimation("idle");
        setInternalExpression(null);
      }
    }, [mode, chatState]);

    // 3. Login mode (password peeking / blindfold)
    useEffect(() => {
      if (mode !== "login") return;

      if (isPasswordActive) {
        if (showPassword) {
          // When password is shown, mascot peeks curiously!
          setInternalExpression("curious-left");
        } else {
          // Normal password typing: mascot closes eyes!
          setInternalExpression("eyes-closed");
        }
      } else {
        setInternalExpression(null);
        setInternalAnimation("idle");
      }
    }, [mode, isPasswordActive, showPassword]);

    // 4. Celebrate mode
    useEffect(() => {
      if (mode !== "celebrate") return;
      setInternalAnimation("celebrate");
      setInternalExpression(null);
      const timer = setTimeout(() => {
        onCelebrationDone?.();
      }, 2600);
      return () => clearTimeout(timer);
    }, [mode, onCelebrationDone]);

    // 5. 404 / Not-Found mode
    useEffect(() => {
      if (mode !== "not-found") return;
      setInternalAnimation("confused");
      setInternalExpression(null);
    }, [mode]);

    // 6. Ambient idle & sleep timer
    useEffect(() => {
      if (mode !== "ambient") return;

      let sleepTimer: NodeJS.Timeout;
      let drowsyTimer: NodeJS.Timeout;

      const handleActivity = () => {
        if (avatarRef.current?.getState().activeAnimation === "sleeping") {
          avatarRef.current.play("waking");
          setTimeout(() => {
            avatarRef.current?.play("idle");
            setInternalAnimation("idle");
          }, 1000);
        }
        clearTimeout(sleepTimer);
        clearTimeout(drowsyTimer);

        drowsyTimer = setTimeout(() => {
          avatarRef.current?.play("drowsy");
          setInternalAnimation("drowsy");
        }, 28000);

        sleepTimer = setTimeout(() => {
          avatarRef.current?.play("sleeping");
          setInternalAnimation("sleeping");
        }, 35000);
      };

      window.addEventListener("mousemove", handleActivity, { passive: true });
      window.addEventListener("keydown", handleActivity, { passive: true });
      handleActivity();

      return () => {
        window.removeEventListener("mousemove", handleActivity);
        window.removeEventListener("keydown", handleActivity);
        clearTimeout(sleepTimer);
        clearTimeout(drowsyTimer);
      };
    }, [mode]);

    // Interactive hover / tap reaction
    const handleClick = useCallback(() => {
      if (interactive && !onClick) {
        const funReactions: AvatarAnimation[] = [
          "happy",
          "excited",
          "playful",
          "laughing",
          "surprised",
        ];
        const next = funReactions[Math.floor(Math.random() * funReactions.length)];
        setInternalExpression(null);
        setInternalAnimation(next);
        setTimeout(() => {
          setInternalAnimation("idle");
        }, 2200);
      }
      onClick?.();
    }, [interactive, onClick]);

    if (!mounted) {
      // Placeholder with exact dimensions to avoid layout shifts before client mount
      return (
        <div
          className={`inline-block relative ${className}`}
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      );
    }

    return (
      <div
        className={`avatar-mascot-wrapper relative inline-flex flex-col items-center select-none ${className}`}
        onMouseEnter={() => {
          setIsHovered(true);
          if (interactive && internalAnimation === "idle") {
            setInternalAnimation("curious");
          }
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          if (interactive && internalAnimation === "curious") {
            setInternalAnimation("idle");
          }
        }}
        onClick={handleClick}
        style={{ cursor: interactive || onClick ? "pointer" : "default" }}
      >
        {/* Optional Speech Bubble - In natural layout flow so it NEVER gets clipped by parent overflow */}
        {speechBubble && (
          <div className="mb-2.5 whitespace-nowrap bg-slate-900 text-white text-xs font-semibold py-1.5 px-3.5 rounded-full shadow-lg border border-slate-700 pointer-events-none animate-bounce z-10 relative flex items-center justify-center">
            <span>{speechBubble}</span>
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
          </div>
        )}

        {/* Mascot Avatar Container */}
        <div
          className={`transition-transform duration-300 ease-out ${
            isHovered ? "scale-105" : "scale-100"
          }`}
        >
          <BaseAvatar
            ref={avatarRef}
            {...(internalExpression
              ? { expression: internalExpression }
              : { animation: internalAnimation })}
            size={size}
            ariaLabel="Interactive procedural mascot"
          />
        </div>
      </div>
    );
  }
);

export default AvatarMascot;
