import { useQuery } from "convex/react";
import { Send } from "lucide-react";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { getCurrentMentionQuery, insertMention } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "./command";
import { Input } from "./input";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";

interface MentionInputProps {
	onSend: (message: string) => void;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	eventId?: Id<"events">;
}

export function MentionInput({
	onSend,
	disabled = false,
	placeholder = "Type a message... Use @ to mention someone",
	className,
	eventId,
}: MentionInputProps) {
	const [message, setMessage] = useState("");
	const [cursorPosition, setCursorPosition] = useState(0);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	// Get the current mention query
	const mentionQuery = getCurrentMentionQuery(message, cursorPosition);
	const searchQuery = mentionQuery?.query ?? "";

	// Search for users to mention
	const users = useQuery(
		api.users.searchForMention,
		showSuggestions && searchQuery.length > 0
			? { query: searchQuery, eventId }
			: "skip",
	);

	// Show suggestions when typing a mention
	useEffect(() => {
		if (mentionQuery && mentionQuery.query.length > 0) {
			setShowSuggestions(true);
			setSelectedIndex(0);
		} else {
			setShowSuggestions(false);
		}
	}, [mentionQuery]);

	const handleSend = useCallback(() => {
		const trimmed = message.trim();
		if (trimmed && !disabled) {
			onSend(trimmed);
			setMessage("");
			setShowSuggestions(false);
		}
	}, [message, disabled, onSend]);

	const handleSelectUser = useCallback(
		(userName: string) => {
			const { newText, newCursorPosition } = insertMention(
				message,
				cursorPosition,
				userName,
			);
			setMessage(newText);
			setCursorPosition(newCursorPosition);
			setShowSuggestions(false);

			// Focus input and set cursor position
			setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.focus();
					inputRef.current.setSelectionRange(
						newCursorPosition,
						newCursorPosition,
					);
				}
			}, 0);
		},
		[message, cursorPosition],
	);

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (showSuggestions && users && users.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) => Math.min(prev + 1, users.length - 1));
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
				return;
			}
			if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault();
				const selectedUser = users[selectedIndex];
				if (selectedUser) {
					handleSelectUser(selectedUser.name);
				}
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				setShowSuggestions(false);
				return;
			}
		}

		if (e.key === "Enter" && !e.shiftKey && !showSuggestions) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(e.target.value);
		setCursorPosition(e.target.selectionStart ?? e.target.value.length);
	};

	const handleSelect = () => {
		if (inputRef.current) {
			setCursorPosition(inputRef.current.selectionStart ?? message.length);
		}
	};

	return (
		<div className={cn("flex gap-2 p-4 border-t", className)}>
			<Popover open={showSuggestions && (users?.length ?? 0) > 0}>
				<PopoverAnchor asChild>
					<Input
						ref={inputRef}
						value={message}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						onSelect={handleSelect}
						onClick={handleSelect}
						placeholder={placeholder}
						disabled={disabled}
						className="flex-1"
					/>
				</PopoverAnchor>
				<PopoverContent
					className="w-64 p-0"
					align="start"
					side="top"
					sideOffset={8}
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<Command>
						<CommandList>
							<CommandEmpty>No users found</CommandEmpty>
							<CommandGroup>
								{users?.map((user, index) => (
									<CommandItem
										key={user._id}
										onSelect={() => handleSelectUser(user.name)}
										className={cn(
											"flex items-center gap-2 cursor-pointer",
											index === selectedIndex && "bg-accent",
										)}
									>
										<Avatar size="sm">
											<AvatarImage src={user.imageUrl} alt={user.name} />
											<AvatarFallback>
												{user.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span>{user.name}</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<Button
				onClick={handleSend}
				disabled={disabled || !message.trim()}
				size="icon"
			>
				<Send className="h-4 w-4" />
			</Button>
		</div>
	);
}
